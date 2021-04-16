const NUM_COLS = 8;
const NUM_ROWS = 8;
const deltas = [-1, 0, 1];

class Cell {
  aliveNow: boolean | null = false;
  aliveNext: boolean | null = null;
  dot = document.createElement("div");
  neighbors: Cell[] = [];
  constructor(public td: HTMLTableCellElement) {
    this.td.addEventListener("click", this.onclick.bind(this));

    if (Math.random() < 0.05) {
      this.toggleAliveNow();
    }

    this.dot.classList.add("dot");
    this.td.appendChild(this.dot);
  }

  onclick(): void {
    this.toggleAliveNext();
    // for (const neighbor of this.neighbors) {
    //   neighbor.update();
    // }
  }

  toggleAliveNow(): void {
    this.aliveNext = !this.aliveNext;
    this.td.classList.toggle("alive-now", this.aliveNext);
  }

  toggleAliveNext(): void {
    this.aliveNext = !this.aliveNext;
    this.td.classList.toggle("alive-next", this.aliveNext);
    this.td.classList.toggle("dead-next", !this.aliveNext);
  }

  // update(): void {}
}

const table = document.createElement("table");

const cells = [];
for (let i = 0; i < NUM_ROWS; i++) {
  const tr = table.appendChild(document.createElement("tr"));
  const row = [];
  for (let j = 0; j < NUM_COLS; j++) {
    const td = tr.appendChild(document.createElement("td"));
    row.push(new Cell(td));
  }
  cells.push(row);
}

document.querySelector("board").appendChild(table);

for (let i = 0; i < NUM_ROWS; i++) {
  for (let j = 0; j < NUM_COLS; j++) {
    for (const di of deltas) {
      for (const dj of deltas) {
        if (di === 0 && dj === 0) {
          continue;
        }
        const t = cells[i + di];
        if (t) {
          // console.log(i, di, j, dj, t[j + dj]);
          t[j + dj]?.neighbors.push(cells[i][j]);
        }
      }
    }
  }
}

// console.log(cells);
