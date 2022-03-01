import { LocatorService } from '../Plugin';
import { Logger } from './../../Common/Logger';

export class ChaturbateDirectLocator extends LocatorService {
  public async Start(): Promise<void> {
    const status = this.IsRunning;
    await super.Start();
    if (status !== this.IsRunning) { Logger.Get.Log('ChaturbateDirectLocator::Start()'); }
  }

  public async Stop(): Promise<void> {
    await super.Stop();
    if (!this.IsRunning) { Logger.Get.Log('ChaturbateDirectLocator::Stop()'); }
  }

  public async Task(): Promise<void> {
    if (this.observables.size === 0) {
      return;
    }

    const sourceList = await Promise
      .all([...this.observables].map(async (x) => {
        await this.pauseFence.ExecutionFence();

        return { url: x, streamUrl: await this.extractor.Extract(x) };
      }));

    sourceList
      .filter(x => x.streamUrl)
      .forEach(x => this.Notify({ url: x.url, streamUrl: x.streamUrl as string }));
  }

  public OnAbort(e: Error): void {
    Logger.Get.Log('ChaturbateDirectLocator::Stop() with ' + e);
  }
}
