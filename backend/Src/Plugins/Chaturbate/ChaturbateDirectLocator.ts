import { LocatorService } from '../Plugin';
import { Logger } from './../../Common/Logger';

export class ChaturbateDirectLocator extends LocatorService {
    public async Start() {
        const status = this.IsRunning;
        await super.Start();
        if (status !== this.IsRunning)
            Logger.Get.Log('ChaturbateDirectLocator::Start()');
    }
    public async Stop() {
        await super.Stop();
        if (!this.IsRunning)
            Logger.Get.Log('ChaturbateDirectLocator::Stop()');
    }
    public async Task() {

        if (this.observables.size === 0) {
            return;
        }

        const sourceList = await Promise
            .all([...this.observables].map(async (x) => ({ url: x, streamUrl: await this.extractor.Extract(x) })));
        sourceList.filter(x => x.streamUrl).forEach(x => this.Notify(x));
    }
    public OnAbort(e: Error) {
        Logger.Get.Log('ChaturbateDirectLocator::Stop() with ' + e);
    }
}
