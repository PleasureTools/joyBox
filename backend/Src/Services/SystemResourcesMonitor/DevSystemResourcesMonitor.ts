import socketIo = require('socket.io');

import { Logger } from '../../Common/Logger';
import { SystemInfo, SystemResourcesMonitor } from '../../Common/Services/SystemResourcesMonitor';
import GetFolderSize from '../../Common/Util';

export class DevSystemResourcesMonitor implements SystemResourcesMonitor {
    private timer: NodeJS.Timeout | null = null;
    private info: SystemInfo = { cpu: 0, rss: 0, hdd: 0 };

    constructor(private io: socketIo.Server, private path: string, private updatePeriod: number) { }

    public get Info(): SystemInfo {
        return this.info;
    }

    public Start() {
        this.Tick();
    }

    private ScheduleNext() {
        this.timer = setTimeout(() => this.Tick(), this.updatePeriod);
    }

    private async Tick() {
        try {
            this.info.hdd = await GetFolderSize(this.path);
        } catch (e) {
            Logger.Get.Log('FIXME: Deleting archive record while GetFolderSize execution.');
        }

        this.info.cpu = (this.info.cpu + 1) % 100;
        ++this.info.rss;

        this.io.emit('SystemMonitorUpdate', this.info);
        this.ScheduleNext();
    }
}
