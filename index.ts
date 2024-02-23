import { StatSnapshot } from "timer-db";
import { patterns } from "./patterns";
import { selectWithoutReplacement, selectWithoutReplacementSeeded } from "./random";
import "./timing";
import { Timer } from "./timing";
import { SwipeTracker } from "./vendor/SwipeTracker";
import { formatTime } from "./vendor/timer-db/format";
import { updateSeed } from "./vendor/random-uint-below/randomUIntBelow";

const ENABLE_SWIPING = getStringParam("swipe", "false") === "true";
const DEMO = getStringParam("demo", "false") === "true";
document.body.classList.toggle("demo", DEMO);
if (DEMO) {
  document
    .querySelector("#second-panel")!
    .appendChild(document.querySelector("#patterns-wrapper")!);
  (document.querySelector("#challenge-wrapper")! as HTMLElement).hidden = true;
}

const G4G = getStringParam("G4G", "false") === "true";
console.log(getStringParam("G4G", "false") );
const TIMED = getStringParam("timed", "false") === "true";
const RIGHT_CLICK = getStringParam("right-click", "false") === "true" || DEMO;

const ALLOW_INCORRECT_ADVANCEMENT =
  TIMED || getStringParam("allow-incorrect-advancement", "false") === "true";

let generation = 1;

class KeyboardListener {
  shiftIsPressed: boolean = false;
  optionIsPressed: boolean = false;
  aliveNumbers: boolean = false;
  deadNumbers: boolean = false;
  constructor() {
    window.addEventListener("keydown", this.keydown.bind(this));
    window.addEventListener("keyup", this.keyup.bind(this));
  }
  keydown(e: KeyboardEvent): void {
    // console.log("keydown", e.key);
    switch (e.key) {
      case "Shift":
        this.shiftIsPressed = true;
        break;
      case "Alt":
        this.optionIsPressed = true;
        break;
      case "A":
        clearNumbers({ alive: true });
        this.aliveNumbers = false;
        break;
      case "a":
        if ((this.aliveNumbers = !this.aliveNumbers)) {
          setNumbers({ alive: true, zero: true });
        } else {
          clearNumbers({ alive: true });
          this.aliveNumbers = false;
        }
        break;
      case "D":
        clearNumbers({ dead: true });
        this.deadNumbers = false;
        break;
      case "d":
        if ((this.deadNumbers = !this.deadNumbers)) {
          setNumbers({ dead: true });
        } else {
          clearNumbers({ dead: true });
          this.deadNumbers = false;
        }
        break;
      case "n":
      case "x":
        clearNeighborMarks();
        break;
      case "m":
        document.querySelector("#minesweeper")!.classList.toggle("show");
        break;
    }
  }
  keyup(e: KeyboardEvent): void {
    // console.log("keyup", e.key);
    switch (e.key) {
      case "Shift":
        this.shiftIsPressed = false;
        break;
      case "Alt":
        this.optionIsPressed = false;
        break;
    }
  }
}

const keyboardListener = new KeyboardListener();

function getStringParam(name: string, defaultValue: string): string {
  const param = new URL(location.href).searchParams.get(name);
  if (!param) {
    return defaultValue;
  }
  return param ?? defaultValue;
}

function getNumParam(name: string, defaultValue: number): number {
  const param = new URL(location.href).searchParams.get(name);
  if (!param) {
    return defaultValue;
  }
  return parseInt(param) ?? defaultValue;
}

const NUM_COLS = getNumParam("cols", 6);
const NUM_ROWS = getNumParam("rows", 6);
const deltas = [-1, 0, 1];

const FACTOR = 1.5;
const DEFAULT_INITIAL_ALIVE = Math.floor(
  Math.sqrt(NUM_COLS * NUM_ROWS) * FACTOR
);
const NUM_INITIAL_ALIVE = getNumParam("alive", DEFAULT_INITIAL_ALIVE);

let timerGlobal: Timer | null = null;

class Cell {
  aliveNow: boolean = false;
  aliveNext: boolean = false;
  dot = document.createElement("div");
  neighbors: Cell[] = [];
  markedChecked = false;
  showingNumber: boolean = false;
  constructor(public td: HTMLTableCellElement) {
    if (!ENABLE_SWIPING || matchMedia("(pointer:fine)").matches) {
      this.td.addEventListener("mousedown", this.onclick.bind(this));
    }
    this.td.addEventListener("touchstart", this.onclick.bind(this));
    this.td.addEventListener(
      "contextmenu",
      this.oncontextmenu.bind(this),
      false
    );
    (this.td as any).cell = this; // for debugging

    this.dot.classList.add("dot");
    this.td.appendChild(this.dot);
  }

  setNumber(zero: boolean = false) {
    this.clearNumber();
    const count = this.countNeighborsAliveNow();
    if (count === 0 && !zero) {
      return;
    }
    this.dot.textContent = count.toString();
    this.dot.classList.add(`number-${count}`);
    this.showingNumber = true;
  }

  clearNumber() {
    this.dot.textContent = "";
    for (let i = 0; i < 10; i++) {
      this.dot.classList.remove(`number-${i}`);
    }
    this.showingNumber = false;
  }

  toggleNumber(zero?: boolean) {
    if (this.showingNumber) {
      this.clearNumber();
    } else {
      this.setNumber(zero);
    }
  }

  highlightNeighbors(): void {
    clearNeighborMarks();
    for (const neighbor of this.neighbors) {
      neighbor.setNeighborMark(true);
    }
  }

  setNeighborMark(on: boolean): void {
    this.td.classList.toggle("neighbor-mark", on);
  }

  resetAlive(alive: boolean = true) {
    this.toggleAliveNow(alive);
    this.aliveNext = this.aliveNow;
    this.td.classList.toggle("alive-next", false);
    this.td.classList.toggle("dead-next", false);
  }

  onclick(e: MouseEvent): void {
    e.preventDefault();
    if (keyboardListener.shiftIsPressed) {
      this.toggleNumber(true);
    } else if (keyboardListener.optionIsPressed) {
      this.highlightNeighbors();
    } else {
      if (this.markChecked()) {
        clearAnnotations({ clearNumbers: false, clearNeighborMarks: false });
      }
      this.toggleAliveNext();
    }
  }

  oncontextmenu(e: MouseEvent): boolean {
    e.preventDefault();
    if (this.markChecked()) {
      clearAnnotations({ clearNumbers: true, clearNeighborMarks: true });
    }
    if (RIGHT_CLICK) {
      this.toggleAliveNow();
    }
    return false;
  }

  toggleAliveNow(value?: boolean ): void {
    this.aliveNow = value ?? !this.aliveNow;
    this.td.classList.toggle("alive-now", this.aliveNow);
  }

  toggleAliveNext(value?: boolean ): void {
    this.aliveNext = value ?? !this.aliveNext;
    this.td.classList.toggle("alive-next", this.aliveNext);
    this.td.classList.toggle("dead-next", !this.aliveNext);
  }

  countNeighborsAliveNow(): number {
    let num = 0;
    for (const neighbor of this.neighbors) {
      num += neighbor.aliveNow ? 1 : 0;
    }
    return num;
  }

  shouldBeAliveNext(): boolean {
    const numNeighborsAliveNow = this.countNeighborsAliveNow();
    if (this.aliveNow) {
      return numNeighborsAliveNow > 1 && numNeighborsAliveNow < 4;
    } else {
      return numNeighborsAliveNow === 3;
    }
  }

  clearChecked(): void {
    this.td.classList.remove("correct");
    this.td.classList.remove("incorrect");
    this.markedChecked = false;
    return;
  }

  markChecked(): boolean {
    this.clearChecked();
    this.markedChecked = true;
    if (this.shouldBeAliveNext() === this.aliveNext) {
      this.td.classList.add("correct");
      return true;
    } else {
      this.td.classList.add("incorrect");
      return false;
    }
  }

  advance1(): void {
    this.toggleAliveNext(this.shouldBeAliveNext());
  }

  advance2(): void {
    this.toggleAliveNow(this.aliveNext);
  }

  // update(): void {}
}

const table = document.createElement("table");
table.classList.add("game-of-life");

const cellGrid: Cell[][] = [];
const allCells: Cell[] = [];
for (let i = 0; i < NUM_ROWS; i++) {
  const tr = table.appendChild(document.createElement("tr"));
  const row: Cell[] = [];
  for (let j = 0; j < NUM_COLS; j++) {
    const td = tr.appendChild(document.createElement("td"));
    const cell = new Cell(td);
    row.push(cell);
    allCells.push(cell);
  }
  cellGrid.push(row);
}

document.querySelector("#board")!.appendChild(table);

for (let i = 0; i < NUM_ROWS; i++) {
  for (let j = 0; j < NUM_COLS; j++) {
    for (const di of deltas) {
      for (const dj of deltas) {
        if (di === 0 && dj === 0) {
          continue;
        }
        const t = cellGrid[i + di];
        if (t) {
          t[j + dj]?.neighbors.push(cellGrid[i][j]);
        }
      }
    }
  }
}

function clearNeighborMarks(): void {
  allCells.map((cell) => cell.setNeighborMark(false));
}

function clearAnnotations(options: {
  clearNumbers: boolean;
  clearNeighborMarks: boolean;
}): void {
  allCells.map((cell) => cell.clearChecked());
  if (options.clearNeighborMarks) {
    clearNeighborMarks();
  }
  if (options.clearNumbers) {
    keyboardListener.aliveNumbers = false;
    keyboardListener.deadNumbers = false;
    allCells.map((cell) => cell.clearNumber());
  }
}

function markChecked(): [allValid: boolean, invalid: number] {
  let invalid = 0;
  for (const cell of allCells) {
    if (!cell.markChecked()) {
      invalid++;
    }
  }
  return [invalid === 0, invalid];
}

document.querySelector("#check")!.addEventListener("click", (e: Event) => {
  e.preventDefault();
  markChecked();
});

document.querySelector("#randomize")!.addEventListener("click", (e: Event) => {
  e.preventDefault();
  setRandom();
});

for (const patternButton of document.querySelectorAll(".pattern")) {
  patternButton.addEventListener("click", (e: Event) => {
    e.preventDefault();
    setPattern(patterns[patternButton.getAttribute("data-pattern")!]);
  });
}

const startElem = document.querySelector("#start") as HTMLButtonElement;
const stopElem = document.querySelector("#advance") as HTMLButtonElement;
stopElem.addEventListener("click", (e: Event) => {
  e.preventDefault();
  const [success, numInvalid] = markChecked();
  if (success || ALLOW_INCORRECT_ADVANCEMENT) {
    if (TIMED) {
      timerGlobal?.stop(numInvalid);
      startElem.disabled = false;
      stopElem.disabled = true;
    } else {
      allCells.map((cell) => cell.advance1());
      allCells.map((cell) => cell.advance2());
      setGeneration(++generation);
    }
  }
  if (!TIMED) {
    setTimeout(() => {
      clearAnnotations({ clearNumbers: true, clearNeighborMarks: true });
    }, 500);
  }
});

function setGeneration(gen: number): void {
  generation = gen;
  document.querySelector("#generation")!.textContent = gen.toString();
}

document.addEventListener("gesturestart", function (e) {
  e.preventDefault();
});

async function setRandom(): Promise<void> {
  clearAnnotations({ clearNumbers: true, clearNeighborMarks: true });
  if (G4G) {
    updateSeed()
  }
  for (const cell of allCells) {
    cell.resetAlive(false);
  }
  const selected = G4G ? selectWithoutReplacementSeeded( allCells, NUM_INITIAL_ALIVE) : selectWithoutReplacement(allCells, NUM_INITIAL_ALIVE);
  for (const cell of await selected) {
    cell.resetAlive(true);
  }
  setGeneration(1);
}

function setPattern(pattern: string): void {
  clearAnnotations({ clearNumbers: true, clearNeighborMarks: true });
  const patternGrid = pattern.split("\n").slice(1);
  for (let i = 0; i < NUM_ROWS; i++) {
    for (let j = 0; j < NUM_COLS; j++) {
      cellGrid[i][j].resetAlive(patternGrid[i][j] === "•");
    }
  }
  setGeneration(1);
}

// Swiping

if (ENABLE_SWIPING) {
  const tracker = new SwipeTracker(
    allCells.map((cell) => cell.td),
    (sector) => ((sector as any).cell as Cell).toggleAliveNext()
  );
}

// Timing

document.querySelector("#timed")!.addEventListener("click", (e: Event) => {
  const url = new URL(location.href);
  url.searchParams.set("timed", (!TIMED).toString());
  location.href = url.toString();
});

if (!TIMED && !DEMO) {
  setRandom();
}

if (TIMED) {
  const timeElem = document.querySelector("#time") as HTMLElement;
  const avg5Elem = document.querySelector("#avg5") as HTMLElement;
  const avg12Elem = document.querySelector("#avg12") as HTMLElement;
  // const last12Elem = document.querySelector("#last12") as HTMLElement;
  timerGlobal = new Timer(
    `life-${NUM_COLS}c-${NUM_ROWS}r-${NUM_INITIAL_ALIVE}a`,
    `Manual Game of Life (${NUM_COLS} columns, ${NUM_ROWS} rows, ${NUM_INITIAL_ALIVE} initially alive)`,
    (time) => {
      timeElem.textContent = formatTime(time, 2);
    },
    (statSnapshot: StatSnapshot) => {
      avg5Elem.textContent = statSnapshot.avg5
        ? formatTime(statSnapshot.avg5)
        : "N/A";
      avg12Elem.textContent = statSnapshot.avg12
        ? formatTime(statSnapshot.avg12)
        : "N/A";
      // last12Elem.textContent = statSnapshot.latest100
      //   .slice(0, 12)
      //   .reverse()
      //   .map((attempt) => formatTime(attempt.resultTotalMs))
      //   .join(", ");
    }
  );

  if (TIMED) {
    document.body.classList.add("timed");
    (document.querySelector("#check") as HTMLButtonElement).hidden = true;
    startElem.hidden = false;
    stopElem.textContent = "Stop";
    stopElem.disabled = true;
    (document.querySelector("#timed-description") as HTMLButtonElement).hidden =
      false;
    document.querySelector("#timed")!.textContent = "⏱ Exit timed mode";
  }

  startElem.addEventListener("click", (e: Event) => {
    setRandom();
    timerGlobal?.start();
    clearAnnotations({ clearNumbers: true, clearNeighborMarks: true });
    startElem.disabled = true;
    stopElem.disabled = false;
  });
}

function setNumbers(options: {
  dead?: boolean;
  alive?: boolean;
  zero?: boolean;
}): void {
  for (const cell of allCells) {
    if (!cell.aliveNow && options.dead) {
      cell.setNumber(options.zero);
    }
    if (cell.aliveNow && options.alive) {
      cell.setNumber(options.zero);
    }
  }
}

function clearNumbers(options: { dead?: boolean; alive?: boolean }): void {
  for (const cell of allCells) {
    if (!cell.aliveNow && options.dead) {
      cell.clearNumber();
    }
    if (cell.aliveNow && options.alive) {
      cell.clearNumber();
    }
  }
}

function toggleNumbers(options: {
  dead?: boolean;
  alive?: boolean;
  zero?: boolean;
}): void {
  for (const cell of allCells) {
    if (!cell.aliveNow && options.dead) {
      cell.toggleNumber(options.zero);
    }
    if (cell.aliveNow && options.alive) {
      cell.toggleNumber(options.zero);
    }
  }
}

(window as any).setNumbers = setNumbers;
(window as any).clearNumbers = clearNumbers;
(window as any).toggleNumbers = toggleNumbers;
