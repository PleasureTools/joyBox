export class LimitedCache<K, V> {
    private data = new Map<K, V>();
    public constructor(private capacity: number) { }
    public Set(key: K, value: V) {
        if (this.data.size >= this.capacity)
            this.data.delete(this.data.keys().next().value);

        this.data.set(key, value);
    }
    public Get(key: K) {
        return this.data.get(key) ?? null;
    }
    public Has(key: K) {
        return this.data.has(key);
    }
    public get Values() { return this.data.values(); }
}
