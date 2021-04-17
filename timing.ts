import { Session, StatSnapshot, TimerDB } from "timer-db";

const INVALID_CELL_PENALTY_MS = 10 * 1000;

export class Timer {
  timerDB = new TimerDB();
  session: Promise<Session>;
  constructor(
    private onTimeChange: (ms: number) => void,
    statCallback: (statsSnapShot: StatSnapshot) => void
  ) {
    this.session = (async () => {
      const sessions = await this.timerDB.getSessions();
      console.log(sessions[0]);
      const session: Session =
        sessions[0] ??
        (await this.timerDB.createSession("Manual Game of Life", "mgol"));
      session.addStatListener(statCallback);
      statCallback(await session.getStatSnapshot());
      return session;
    })();
  }

  startTime: number | null = null;
  running = false;
  start(): void {
    this.startTime = Date.now();
    this.running = true;
    requestAnimationFrame(this.rAF.bind(this));
  }

  rAF(): void {
    if (this.running) {
      this.onTimeChange(Date.now() - this.startTime);
      requestAnimationFrame(this.rAF.bind(this));
    }
  }

  async stop(numInvalid: number): Promise<void> {
    this.running = false;
    const time =
      Date.now() - this.startTime + numInvalid * INVALID_CELL_PENALTY_MS;
    console.log(time, numInvalid);
    this.onTimeChange(time);
    (await this.session).add({
      resultTotalMs: time,
      unixDate: Date.now(),
    });
  }
}
