/**
 * Represents a recurring task.
 * Rescheduling will be canceled, if exceptions throws.
 */
export abstract class RecurringTask {
  private isRunning = false;
  private isTaskRunning = false;
  private timer!: NodeJS.Timeout;
  private resolveCb: (() => void) | null = null;
  public get IsRunning(): boolean { return this.isRunning; }
  public constructor(protected period: number) { }
  public async Start(): Promise<void> {
    if (!this.isRunning) {
      this.isRunning = true;
      await this.ScheduleNext();
    }
  }

  public async Stop(): Promise<void> {
    if (this.isRunning) {
      this.isRunning = false;
      clearTimeout(this.timer);
    }
    return this.isTaskRunning ? new Promise<void>(r => (this.resolveCb = r)) : Promise.resolve();
  }

  public abstract Task(): Promise<void>;

  public abstract OnAbort(e: Error): void;

  private async ScheduleNext() {
    this.isTaskRunning = true;
    try {
      await this.Task();

      this.isTaskRunning = false;

      if (this.isRunning) { this.timer = setTimeout(() => this.ScheduleNext(), this.period); }
    } catch (e) {
      this.isTaskRunning = false;
      this.isRunning = false;
      this.OnAbort(e as Error);
    }

    if (this.resolveCb !== null) {
      this.resolveCb();
      this.resolveCb = null;
    }
  }
}
