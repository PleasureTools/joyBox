import {
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';

import { AppStateSnapshot } from '@Shared/Types';

@Module({ namespaced: true, name: 'settings' })
export default class Settings extends VuexModule {
  public webPushAvailable = false;
  public webPushEnabled = false;
  public newRecordNotification = false;
  public sizeQuotaNotification = false;
  public storageQuota = 0;
  public instanceQuota = 0;
  public downloadSpeedQuota = 0;
  public remoteSeleniumUrl = '';
  @Mutation
  public SOCKET_Snapshot(snapshot: AppStateSnapshot) {
    this.storageQuota = snapshot.storageQuota;
    this.instanceQuota = snapshot.instanceQuota;
    this.downloadSpeedQuota = snapshot.downloadSpeedQuota;
    this.remoteSeleniumUrl = snapshot.remoteSeleniumUrl;
  }

  @Mutation
  public SOCKET_UpdateStorageQuota(quota: number) {
    this.storageQuota = quota;
  }

  @Mutation
  public SOCKET_UpdateInstanceQuota(quota: number) {
    this.instanceQuota = quota;
  }

  @Mutation
  public SOCKET_UpdateDownloadSpeedQuota(quota: number) {
    this.downloadSpeedQuota = quota;
  }

  @Mutation
  public SOCKET_UpdateRemoteSeleniumUrl(url: string) {
    this.remoteSeleniumUrl = url;
  }

  @Mutation
  public WebPushAvailable(val: boolean) {
    this.webPushAvailable = val;
  }

  @Mutation
  public WebPushEnabled(val: boolean) {
    this.webPushEnabled = val;
  }

  @Mutation
  public NewRecordNotification(val: boolean): void {
    this.newRecordNotification = val;
  }

  @Mutation
  public SizeQuotaNotification(val: boolean) {
    this.sizeQuotaNotification = val;
  }

  public get HasEnabledNotification() {
    return this.sizeQuotaNotification || this.newRecordNotification;
  }
}
