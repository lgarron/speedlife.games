import { glider } from "./patterns";
import { selectWithoutReplacement } from "./random";
import { SwipeTracker } from "./vendor/SwipeTracker";

const ENABLE_SWIPING = getStringParam("swipe", "false") === "true";

const ALLOW_INCORRECT_ADVANCEMENT =
  getStringParam("allowIncorrectAdvancement", "false") === "true";

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

class Cell {
  aliveNow: boolean = false;
  aliveNext: boolean = false;
  dot = document.createElement("div");
  neighbors: Cell[] = [];
  markedChecked = false;
  constructor(public td: HTMLTableCellElement) {
    if (!ENABLE_SWIPING || matchMedia("(pointer:fine)").matches) {
      this.td.addEventListener("mousedown", this.onclick.bind(this));
    }
    (this.td as any).cell = this; // for debugging

    this.dot.classList.add("dot");
    this.td.appendChild(this.dot);
  }

  resetAlive(alive: boolean = true) {
    this.toggleAliveNow(alive);
    this.aliveNext = this.aliveNow;
    this.td.classList.toggle("alive-next", false);
    this.td.classList.toggle("dead-next", false);
  }

  onclick(e: Event): void {
    e.preventDefault();
    if (this.markChecked) {
      clearChecked();
    }
    this.toggleAliveNext();
  }

  toggleAliveNow(value: boolean = undefined): void {
    this.aliveNow = value ?? !this.aliveNow;
    this.td.classList.toggle("alive-now", this.aliveNow);
  }

  toggleAliveNext(value: boolean = undefined): void {
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

const cellGrid: Cell[][] = [];
const allCells: Cell[] = [];
for (let i = 0; i < NUM_ROWS; i++) {
  const tr = table.appendChild(document.createElement("tr"));
  const row = [];
  for (let j = 0; j < NUM_COLS; j++) {
    const td = tr.appendChild(document.createElement("td"));
    const cell = new Cell(td);
    row.push(cell);
    allCells.push(cell);
  }
  cellGrid.push(row);
}

document.querySelector("#board").appendChild(table);

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

function clearChecked(): void {
  allCells.map((cell) => cell.clearChecked());
}

function markChecked(): boolean {
  let success = true;
  for (const cell of allCells) {
    if (!cell.markChecked()) {
      success = false;
    }
  }
  return success;
}

document.querySelector("#check").addEventListener("click", (e: Event) => {
  e.preventDefault();
  markChecked();
});

document.querySelector("#randomize").addEventListener("click", (e: Event) => {
  e.preventDefault();
  setRandom();
});

document.querySelector("#glider").addEventListener("click", (e: Event) => {
  e.preventDefault();
  setPattern(glider);
});

document.querySelector("#advance").addEventListener("click", (e: Event) => {
  e.preventDefault();
  const success = markChecked();
  if (success || ALLOW_INCORRECT_ADVANCEMENT) {
    allCells.map((cell) => cell.advance1());
    allCells.map((cell) => cell.advance2());
  }
  setTimeout(() => {
    clearChecked();
  }, 500);
});

document.addEventListener("gesturestart", function (e) {
  e.preventDefault();
});

function setRandom() {
  for (const cell of allCells) {
    cell.resetAlive(false);
  }
  for (const cell of selectWithoutReplacement(allCells, NUM_INITIAL_ALIVE)) {
    cell.resetAlive(true);
  }
}

function setPattern(pattern: string): void {
  const patternGrid = pattern.split("\n").slice(1);
  console.log(patternGrid);
  for (let i = 0; i < NUM_ROWS; i++) {
    for (let j = 0; j < NUM_COLS; j++) {
      console.log((cellGrid[i][j], patternGrid[i][j]));
      cellGrid[i][j].resetAlive(patternGrid[i][j] === "•");
    }
  }
}

if (ENABLE_SWIPING) {
  const tracker = new SwipeTracker(
    allCells.map((cell) => cell.td),
    (sector) => ((sector as any).cell as Cell).toggleAliveNext()
  );
}

setRandom();
