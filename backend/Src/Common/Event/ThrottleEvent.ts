import { Event } from '.';

export class ThrottleEvent<T> extends Event<T> {
    private prevEmit: number = -1;
    public constructor(private duration: number) { super(); }
    public Emit(e: T): void {
        const now = Date.now();
        if (now - this.prevEmit > this.duration) {
            this.cbs.forEach(x => x(e));
            this.prevEmit = now;
        }
    }
}
