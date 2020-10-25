import { Event } from '@/Common/Event';
import { Logger } from '@/Common/Logger';
import { SystemInfo } from '@Shared/Types';
import { RecordingService } from '../../RecordingService';
import { SystemResourcesMonitor } from '../../SystemResourcesMonitor';
import { Arbiter } from '../PluginManagerController';

export class StorageQuota implements Arbiter {
    public readonly VoteEvent = new Event<void>();
    private quota = 0;
    private size = 0;
    private decision = true;
    public constructor(
        private recorder: RecordingService,
        private resourceMonitor: SystemResourcesMonitor) {
        resourceMonitor.OnUpdate.On(this.systemMonitorTickFn);
    }
    public Dispose() {
        this.resourceMonitor.OnUpdate.Off(this.systemMonitorTickFn);
    }
    public get Quota() { return this.quota; }
    public set Quota(quota: number) {
        if (this.quota !== quota) {
            this.quota = quota;
            this.OnUpdate();
        }
    }
    public Decision() {
        return this.decision;
    }
    private systemMonitorTickFn = (info: SystemInfo) => this.SystemMonitorTick(info.hdd);
    private OnUpdate() {
        const newDecision = this.size <= this.quota;

        if (this.decision !== newDecision) {
            this.decision = newDecision;
            this.VoteEvent.Emit();
        }

        if (this.decision === false) {
            Logger.Get.Log('Plugin manager has been stopped due storage quota');
            this.recorder.Records.forEach(x => this.recorder.StopRecording(x.label));
        }
    }
    private SystemMonitorTick(hdd: number) {
        if (this.size !== hdd) {
            this.size = hdd;
            this.OnUpdate();
        }
    }
}
