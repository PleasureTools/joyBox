import axios from 'axios';
import * as Rx from 'rxjs';
import * as Rop from 'rxjs/operators';

import { LocatorService } from '../Plugin';
import { Logger } from './../../Common/Logger';

export class BongacamsDirectLocator extends LocatorService {
  private readonly EMPTY_PLAYLIST_SIZE = 25;
  public async Start(): Promise<void> {
    const status = this.IsRunning;
    await super.Start();
    if (status !== this.IsRunning) { Logger.Get.Log('BongacamsDirectLocator::Start()'); }
  }

  public async Stop(): Promise<void> {
    await super.Stop();
    if (!this.IsRunning) { Logger.Get.Log('BongacamsDirectLocator::Stop()'); }
  }

  public async Task(): Promise<void> {
    if (this.observables.size === 0) {
      return;
    }

    try {
      await this.pauseFence.ExecutionFence();

      Rx.from([...this.observables])
        .pipe(
          Rop.flatMap(async (x) => {
            await this.pauseFence.ExecutionFence();

            return { url: x, streamUrl: await this.extractor.Extract(x) };
          }),
          Rop.catchError(x => Rx.of(({ url: x, streamUrl: '' }))),
          Rop.flatMap(async (x) => ({ ...x, online: await this.IsOnline(x.streamUrl) })),
          Rop.filter(x => x.online)
        ).subscribe(x => this.Notify({ url: x.url, streamUrl: x.streamUrl as string }));
    } catch (e) {
      Logger.Get.Log(e as string);
    }
  }

  public OnAbort(e: Error): void {
    Logger.Get.Log('BongacamsDirectLocator::Stop() with ' + e);
  }

  private async IsOnline(source: string | null): Promise<boolean> {
    if (source === null) {
      return false;
    }

    try {
      const response = await axios.get<string>(source);
      const playlistContent = response.data;
      return playlistContent.length !== this.EMPTY_PLAYLIST_SIZE;
    } catch (e) {
      return false;
    }
  }
}
