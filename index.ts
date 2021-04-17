import { selectWithoutReplacement } from "./random";

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

const DEFAULT_INITIAL_ALIVE = Math.floor(Math.sqrt(NUM_COLS * NUM_ROWS) * 1.5);
const NUM_INITIAL_ALIVE = getNumParam("alive", DEFAULT_INITIAL_ALIVE);

class Cell {
  aliveNow: boolean = false;
  aliveNext: boolean = false;
  dot = document.createElement("div");
  neighbors: Cell[] = [];
  markedChecked = false;
  constructor(public td: HTMLTableCellElement) {
    this.td.addEventListener("click", this.onclick.bind(this));
    (this.td as any).cell = this; // for debugging

    this.dot.classList.add("dot");
    this.td.appendChild(this.dot);
  }

  setInitialAlive() {
    this.toggleAliveNow();
    this.aliveNext = this.aliveNow;
  }

  onclick(e: Event): void {
    e.preventDefault();
    if (this.markChecked) {
      markChecked(false);
    }
    this.toggleAliveNext();
    // for (const neighbor of this.neighbors) {
    //   neighbor.update();
    // }
  }

  toggleAliveNow(): void {
    this.aliveNow = !this.aliveNow;
    this.td.classList.toggle("alive-now", this.aliveNow);
  }

  toggleAliveNext(): void {
    this.aliveNext = !this.aliveNext;
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

  markChecked(mark: boolean): void {
    if (!mark) {
      this.td.classList.remove("correct");
      this.td.classList.remove("incorrect");
      this.markedChecked = false;
      return;
    }

    const numNeighborsALiveNow = this.countNeighborsAliveNow();
    const shouldBeAliveNext =
      numNeighborsALiveNow > 1 && numNeighborsALiveNow < 4;
    if (shouldBeAliveNext === this.aliveNext) {
      this.td.classList.add("correct");
    } else {
      this.td.classList.add("incorrect");
    }
    this.markedChecked = true;
  }

  // update(): void {}
}

const table = document.createElement("table");

const cellGrid = [];
const allCells = [];
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

for (const cell of selectWithoutReplacement(allCells, NUM_INITIAL_ALIVE)) {
  cell.setInitialAlive();
}

document.querySelector("board").appendChild(table);

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

function markChecked(mark: boolean): void {
  for (const cell of allCells) {
    cell.markChecked(mark);
  }
}

document.querySelector("#check").addEventListener("click", () => {
  markChecked(true);
});
