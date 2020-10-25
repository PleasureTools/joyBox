export class ServiceWorker {
    private instance: ServiceWorkerRegistration | null = null;
    public async Start() {
        this.instance = await navigator.serviceWorker.getRegistration() || null;
        if (!this.instance)
            this.instance = await navigator.serviceWorker.register('/service-worker.js');
    }
    public get Instacnce() { return this.instance; }
}
