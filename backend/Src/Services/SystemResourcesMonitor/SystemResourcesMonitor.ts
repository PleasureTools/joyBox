import { SystemInfo } from '@Shared/Types';
import { Event } from '../../Common/Event';
import { RecurringTask } from './../../Common/RecurringTask';

export abstract class SystemResourcesMonitor extends RecurringTask {
    public readonly Info: SystemInfo = { cpu: 0, rss: 0, hdd: 0 };
    public readonly OnUpdate = new Event<SystemInfo>();
    public constructor(updatePeriod: number) { super(updatePeriod); }
    public abstract async Collect(): Promise<void>;
    public async Task() {
        await this.Collect();
        this.OnUpdate.Emit(this.Info);
    }
}
