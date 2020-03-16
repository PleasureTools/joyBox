export class LinkCounter<T> {
    private usage = new Map<T, number>();
    public Capture(label: T) {
        const found = this.usage.get(label) || 0;
        this.usage.set(label, found + 1);
    }
    public Release(label: T) {
        const found = this.usage.get(label) || 0;
        this.usage.set(label, found - 1);
    }
    public Captured(label: T) { return !!this.usage.get(label); }
}
