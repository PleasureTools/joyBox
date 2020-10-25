import { UrlBase64ToUint8Array } from './../Common/Util';

export class PushService {
    private instance: ServiceWorkerRegistration | null = null;
    public async GetInstance() {
        if (!this.instance)
            this.instance = await navigator.serviceWorker.getRegistration() || null;
    }
    public async Subscribe(VAPIDKey: string) {
        await this.GetInstance();
        if (await this.instance?.pushManager.getSubscription())
            return null;

        if (!VAPIDKey)
            return null;

        try {
            return await this.instance?.pushManager
                .subscribe({ userVisibleOnly: true, applicationServerKey: UrlBase64ToUint8Array(VAPIDKey) });
        } catch (e) {
            return null;
        }
    }
    public async Unsubscribe() {
        await this.GetInstance();
        if (!this.instance)
            return;

        const subscription = await this.instance.pushManager.getSubscription();

        if (!subscription)
            return;

        await subscription.unsubscribe();
    }
    public async RetrieveEndpoint() {
        await this.GetInstance();
        if (!this.instance)
            return '';

        const subscription = await this.instance.pushManager.getSubscription();

        if (!subscription)
            return '';

        return subscription.endpoint;
    }
}
