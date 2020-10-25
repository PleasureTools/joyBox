import {
    Module,
    Mutation,
    VuexModule,
} from 'vuex-module-decorators';

import { Snapshot } from '@Shared/Types';

@Module({ namespaced: true, name: 'settings' })
export default class Settings extends VuexModule {
    public webPushAvailable: boolean = false;
    public webPushEnabled: boolean = false;
    public storageQuota: number = 0;
    public instanceQuota: number = 0;
    public downloadSpeedQuota = 0;
    @Mutation
    public SOCKET_Snapshot(snapshot: Snapshot) {
        this.storageQuota = snapshot.storageQuota;
        this.instanceQuota = snapshot.instanceQuota;
        this.downloadSpeedQuota = snapshot.downloadSpeedQuota;
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
    public WebPushAvailable(val: boolean) {
        this.webPushAvailable = val;
    }
    @Mutation
    public WebPushEnabled(val: boolean) {
        this.webPushEnabled = val;
    }
}
