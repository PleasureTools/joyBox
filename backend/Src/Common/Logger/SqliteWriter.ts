import { LogWriter } from './';
import { SqliteAdapter } from './../../Services/SqliteAdapter';

export class SqliteWriter implements LogWriter {
    public constructor(private storage: SqliteAdapter) { }
    public Write(text: string): void { this.storage.Log(text); }
}
