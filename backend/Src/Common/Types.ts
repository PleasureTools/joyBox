import { NotificationType } from '@Shared/Types';
import { PushSubscription } from 'web-push';
import { LocatorService } from '../Plugins/Plugin';
export interface Plugin {
  id: number;
  name: string;
  enabled: boolean;
  service: LocatorService;
}
export interface ObservableStream {
  // User-friendly stream url
  url: string;
  lastSeen: number;
  download: number;
  valid: boolean;
  // Plugins that can handle stream, arranged in priority order
  plugins: Plugin[];
}

export type TrackedStreamCollection = Map<string, ObservableStream>;

export interface ClientSubscription {
  push: PushSubscription;
  notifications: NotificationType[]
}
