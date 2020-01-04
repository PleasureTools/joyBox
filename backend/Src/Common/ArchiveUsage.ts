export class ArchiveUsage {
    private usage = new Map<string, number>();
    public Capture(label: string) {
        const found = this.usage.get(label) || 0;
        this.usage.set(label, found + 1);
    }
    public Release(label: string) {
        const found = this.usage.get(label) || 0;
        this.usage.set(label, found - 1);
    }
    public Captured(label: string) { return !!this.usage.get(label); }
}
