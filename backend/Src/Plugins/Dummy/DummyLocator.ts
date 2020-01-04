import { LocatorService } from '../Plugin';
import { Logger } from './../../Common/Logger';
export class DummyLocator extends LocatorService {
    public Start(): void {
        Logger.Get.Log('DummyLocator::Start()');
    }
    public Stop(): void {
        Logger.Get.Log('DummyLocator::Stop()');
    }
}
