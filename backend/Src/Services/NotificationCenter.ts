import { ClientSubscription } from '@/Common/Types';
import { NotificationType } from '@Shared/Types';
import * as webpush from 'web-push';
import { PushSubscription } from 'web-push';

import { Config } from '../BootstrapConfiguration';
import { SqliteAdapter } from './SqliteAdapter';

export interface NotifyPayload {
  title?: string;
  body?: string;
  image?: string;
  data?: Record<string, unknown>;
}
export class NotificationCenter {
  private subscriptions = new Map<string, ClientSubscription>();

  private payload!: NotifyPayload;

  public constructor(private storage: SqliteAdapter) {
    this.subscriptions = storage.FetchSubscriptions();
    if (Config.WebPushEnabled) { webpush.setVapidDetails(Config.VAPID!.subject, Config.VAPID!.publicKey, Config.VAPID!.privateKey); }
  }

  public AddSubscription(subscription: PushSubscription, notification: NotificationType): void {
    const sub = this.subscriptions.get(subscription.endpoint);

    if (sub) {
      sub.notifications.push(notification);
    } else {
      this.subscriptions.set(subscription.endpoint, { push: subscription, notifications: [notification] });
    }

    this.storage.AddSubscription(subscription, notification);
  }

  public AddNotification(endpoint: string, notification: NotificationType): boolean {
    const sub = this.subscriptions.get(endpoint);

    if (sub && !sub.notifications.includes(notification)) {
      sub.notifications.push(notification);
      this.storage.AddSubscriptionNotification(endpoint, notification);
    }

    return sub !== undefined;
  }

  public RemoveNotification(endpoint: string, notification: NotificationType): void {
    const sub = this.subscriptions.get(endpoint);

    if (sub) {
      const idx = sub.notifications.findIndex(x => x === notification);

      if (idx >= 0) {
        if (sub.notifications.length === 1) {
          this.subscriptions.delete(sub.push.endpoint);

          this.storage.RemoveSubscription(endpoint);
        } else {
          sub.notifications.splice(idx, 1);

          this.storage.RemoveSubscriptionNotification(endpoint, notification);
        }
      }
    }
  }

  public RetrieveNotifications(endpoint: string): NotificationType[] {
    return this.subscriptions.get(endpoint)?.notifications || [];
  }

  public HasSubscription(endpoint: string): boolean {
    return this.subscriptions.has(endpoint);
  }

  public NotifyAll(payload: NotifyPayload): void {
    this.payload = payload;
    this.subscriptions.forEach((x, i) => this.Notify(x));
  }

  public NotifyAllByType(payload: NotifyPayload, type: NotificationType): void {
    this.payload = payload;

    [...this.subscriptions.values()]
      .filter(x => x.notifications.includes(type))
      .forEach(x => this.Notify(x));
  }

  private async Notify(subscription: ClientSubscription) {
    try {
      await webpush.sendNotification(subscription.push, Buffer.from(JSON.stringify(this.payload)));
    } catch (e) {
      if (e.statusCode === 410) {
        this.subscriptions.delete(subscription.push.endpoint);
        this.storage.RemoveSubscription(subscription.push.endpoint);
      }
    }
  }
}
