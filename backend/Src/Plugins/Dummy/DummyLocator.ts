import { LocatorService } from '../Plugin';
import { Logger } from './../../Common/Logger';
export class DummyLocator extends LocatorService {
    public async Start() {
        const status = this.IsRunning;
        await super.Start();
        if (status !== this.IsRunning)
            Logger.Get.Log('DummyLocator::Start()');
    }
    public async Stop() {
        await super.Stop();
        if (!this.IsRunning)
            Logger.Get.Log('DummyLocator::Stop()');
    }
    public async Task() { }
    public OnAbort(e: Error) {
        Logger.Get.Log('DummyLocator::Stop() with ' + e);
    }
}
