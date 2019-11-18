import { LocatorService } from '../Plugin';

export class DummyLocator extends LocatorService {
    public Start(): void {
        console.log('DummyLocator::Start()');
    }
    public Stop(): void {
        console.log('DummyLocator::Stop()');
    }
}
