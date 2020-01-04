import { LogWriter } from './';

export class ConsoleWriter implements LogWriter {
    public Write(text: string): void { console.log(text); }
}
