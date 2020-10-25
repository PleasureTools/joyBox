import { Broadcaster } from '@/ClientIO';
import { Logger } from '@/Common/Logger';
import { GetFolderSize } from '@/Common/Util';
import { SystemResourcesMonitor } from './SystemResourcesMonitor';

export class DefaultSystemResourceMonitor extends SystemResourcesMonitor {
    constructor(private path: string, updatePeriod: number) {
        super(updatePeriod);
     }
    public async Collect() {
        try {
            this.Info.hdd = await GetFolderSize(this.path);
        } catch (e) {
            Logger.Get.Log('FIXME: Deleting archive record while GetFolderSize execution.');
        }
    }
    public OnAbort(e: Error) {
        Logger.Get.Log('DefaultSystemResourceMonitor::Stop() with ' + e);
    }
}
