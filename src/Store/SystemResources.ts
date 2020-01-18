import {
    Module,
    Mutation,
    VuexModule,
} from 'vuex-module-decorators';

import { Snapshot } from '@/types';

interface SystemResourcesInfo {
    cpu: number;
    rss: number;
    hdd: number;
}
@Module({ namespaced: true, name: 'systemResources' })
export default class SystemResources extends VuexModule {
    public cpu = 0;
    public rss = 0;
    public hdd = 0;
    @Mutation
    public SOCKET_Snapshot(snapshot: Snapshot) {
        this.cpu = snapshot.systemResources.cpu;
        this.rss = snapshot.systemResources.rss;
        this.hdd = snapshot.systemResources.hdd;
    }
    @Mutation
    public SOCKET_SystemMonitorUpdate(info: SystemResourcesInfo) {
        this.cpu = info.cpu;
        this.rss = info.rss;
        this.hdd = info.hdd;
    }
}
