import { Session, StatSnapshot, TimerDB } from "timer-db";

const INVALID_CELL_PENALTY_MS = 10 * 1000;

export class Timer {
  timerDB = new TimerDB();
  session: Promise<Session>;
  constructor(
    eventID: string,
    eventName: string,
    private onTimeChange: (ms: number) => void,
    private statCallback: (statsSnapShot: StatSnapshot) => void
  ) {
    this.session = (async () => {
      this.timerDB.getSessions;
      const sessions = await this.timerDB.getSessions();
      let session: Session;
      for (const maybeSession of sessions) {
        if (maybeSession.eventID === eventID) {
          session = maybeSession;
        }
      }
      if (!session) {
        session = await this.timerDB.createSession(eventName, eventID);
      }
      session.addStatListener(statCallback);
      this.dispatchStatCallback();
      return session;
    })();
  }

  async dispatchStatCallback(): Promise<void> {
    this.statCallback(await (await this.session).getStatSnapshot());
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
    await (await this.session).add({
      resultTotalMs: time,
      unixDate: Date.now(),
    });
    this.dispatchStatCallback();
  }
}
