import { UrlBase64ToUint8Array } from './../Common/Util';

export class PushService {
  private instance: ServiceWorkerRegistration | null = null;
  public async GetInstance(): Promise<void> {
    if (!this.instance) { this.instance = await navigator.serviceWorker.getRegistration() || null; }
  }

  public async Subscribe(VAPIDKey: string): Promise<PushSubscription | null> {
    await this.GetInstance();
    const sub = await this.instance?.pushManager.getSubscription();
    if (sub) { return sub; }

    if (!VAPIDKey) { return null; }

    try {
      return await this.instance?.pushManager
        .subscribe({ userVisibleOnly: true, applicationServerKey: UrlBase64ToUint8Array(VAPIDKey) }) || null;
    } catch (e) {
      return null;
    }
  }

  public async Unsubscribe(): Promise<void> {
    await this.GetInstance();
    if (!this.instance) { return; }

    const subscription = await this.instance.pushManager.getSubscription();

    if (!subscription) { return; }

    await subscription.unsubscribe();
  }

  public async RetrieveEndpoint(): Promise<string> {
    await this.GetInstance();
    if (!this.instance) { return ''; }

    const subscription = await this.instance.pushManager.getSubscription();

    if (!subscription) { return ''; }

    return subscription.endpoint;
  }
}
