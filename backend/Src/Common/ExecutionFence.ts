export class ExecutionFence {
    private fence: Promise<void> | null = null;
    private resolve: (() => void) | null = null;
    // Pause execution in place where PauseFence() invoked
    public Pause(): void {
        this.fence = new Promise(r => this.resolve = r);
    }
    // Resume execution after Pause()
    public Resume(): void {
        if (this.resolve) {
            this.resolve();

            this.resolve = null;
            this.fence = null;
        }
    }
    // Pause execution if Pause() was invoked
    public async ExecutionFence() {
        if (this.fence)
            await this.fence;
    }
}