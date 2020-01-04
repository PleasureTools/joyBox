import { LiveStream, LocatorService } from '../Plugin';
import { Logger } from './../../Common/Logger';

export class ChaturbateDirectLocator extends LocatorService {
    private checkTimer: NodeJS.Timeout | null = null;
    private checkoutPeriod = 10000;

    public Start(): void {
        Logger.Get.Log('ChaturbateDirectLocator::Start()');

        if (this.checkTimer === null)
            this.Tick();

    }
    public Stop(): void {
        Logger.Get.Log('ChaturbateDirectLocator::Stop()');

        if (!this.IsStarted) {
            return;
        }

        clearTimeout(this.checkTimer as NodeJS.Timeout);
        this.checkTimer = null;
    }

    public get IsStarted() {
        return this.checkTimer !== null;
    }

    private async Tick() {
        await this.CheckObservables();
        this.ScheduleNext();
    }

    private async CheckObservables() {

        if (this.observables.size === 0) {
            return;
        }

        const sourceList = await Promise
            .all([...this.observables].map(async (x) => ({ url: x, streamUrl: await this.extractor.Extract(x) })));
        sourceList.filter(x => x.streamUrl).forEach(x => this.Notify(x));
    }

    private ScheduleNext() {
        this.checkTimer = setTimeout(() => this.Tick(), this.checkoutPeriod);
    }
}
