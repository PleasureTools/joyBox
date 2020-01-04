import * as webpush from 'web-push';
import { PushSubscription } from 'web-push';

import { Config } from '../BootstrapConfiguration';
import { SqliteAdapter } from './SqliteAdapter';

export interface NotifyPayload {
    title?: string;
    body?: string;
    image?: string;
    data?: object;
}

export class NotificationCenter {
    private subscriptions: PushSubscription[];

    private payload!: NotifyPayload;

    public constructor(private storage: SqliteAdapter) {
        this.subscriptions = storage.FetchSubscriptions();
        if (Config.VAPID === null)
            return;
        webpush.setVapidDetails(Config.VAPID!.subject, Config.VAPID!.publicKey, Config.VAPID!.privateKey);
    }

    public AddSubscription(subscription: PushSubscription) {
        this.subscriptions.push(subscription);
        this.storage.AddSubscription(subscription);
    }

    public HasSubscription(endpoint: string) {
        return this.subscriptions.findIndex(x => x.endpoint === endpoint) >= 0;
    }

    public NotifyAll(payload: NotifyPayload) {
        this.payload = payload;
        this.subscriptions.forEach((x, i) => this.Notify(x, i));
    }

    private async Notify(subscription: PushSubscription, idx: number) {
        try {
            await webpush.sendNotification(subscription, Buffer.from(JSON.stringify(this.payload)));
        } catch (e) {
            if (e.statusCode === 410) {
                this.subscriptions.splice(idx, 1);
                this.storage.RemoveSubscription(subscription.endpoint);
            }
        }
    }
}
