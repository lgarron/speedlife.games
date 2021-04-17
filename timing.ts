import { StatSnapshot } from "timer-db";
import { Session, TimerDB } from "timer-db";

export class Timer {
  timerDB = new TimerDB();
  session: Promise<Session>;
  constructor(private onTimeChange: (ms: number) => void) {
    this.session = (async () => {
      const sessions = this.timerDB.getSessions();
      const session: Session =
        sessions[0] ??
        (await this.timerDB.createSession("Manual Game of Life", "mgol"));
      session.addStatListener(this.onStat);
      session.add({
        resultTotalMs: 7080,
        unixDate: Date.now(),
      });
      return session;
    })();
  }

  onStat(snapshot: StatSnapshot): void {
    console.log({ snapshot });
  }

  startTime: number | null = null;
  running = false;
  start(): void {
    this.startTime = Date.now();
    this.running = true;
    requestAnimationFrame(this.rAF.bind(this));
  }

  rAF(): void {
    this.onTimeChange(Date.now() - this.startTime);
    if (this.running) {
      requestAnimationFrame(this.rAF.bind(this));
    }
  }

  async stop(): Promise<void> {
    this.running = false;
    const time = Date.now() - this.startTime;
    this.onTimeChange(time);
    (await this.session).add({
      resultTotalMs: time,
      unixDate: Date.now(),
    });
  }
}
