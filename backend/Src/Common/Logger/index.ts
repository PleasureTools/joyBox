import { Ref } from '@Shared//Types';

export { ConsoleWriter } from './ConsoleWriter';
export { SqliteWriter } from './SqliteWriter';

export interface LogWriter {
    Write(text: string): void;
}
export class Logger {
    private static instance: Ref<Logger> = null;
    private writers: Set<LogWriter> = new Set();
    private constructor() { }
    public static get Get() { return this.instance ? this.instance : this.instance = new Logger(); }
    public AddWriter(writer: LogWriter) { this.writers.add(writer); }
    public RemoveWriter(writer: LogWriter) { this.writers.delete(writer); }
    public Log(msg: string) { this.writers.forEach(x => x.Write(msg)); }
}
