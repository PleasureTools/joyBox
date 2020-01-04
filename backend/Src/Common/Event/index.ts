export interface Observable<T> {
    On(cb: (e: T) => void): void;
    Off(cb: (e: T) => void): void;
}

export class Event<T> implements Observable<T> {
    protected cbs: Set<(e: T) => void> = new Set();
    public On(cb: (e: T) => void): void { this.cbs.add(cb); }
    public Off(cb: (e: T) => void): void { this.cbs.delete(cb); }
    public Emit(e: T): void { this.cbs.forEach(x => x(e)); }
}

export { ThrottleEvent } from './ThrottleEvent';
