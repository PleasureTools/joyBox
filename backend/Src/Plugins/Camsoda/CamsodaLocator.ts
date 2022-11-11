/* eslint-disable camelcase */
import axios from 'axios';

import { Logger } from '../../Common/Logger';
import { isAxiosError, UsernameFromUrl } from '../../Common/Util';
import { LocatorService } from '../Plugin';

export interface Result {
  bitrate: number;
  new: boolean;
  offline_picture: string;
  tpl: any[];
  status: string;
  spy_allowed?: number;
  control_her?: number;
  top_pvt?: number;
  aspect?: number;
  app_id?: number;
  voyeur?: boolean;
  slug: string;
  accepts_tokens?: number;
  aspect_ratio: string;
}

export interface OnlineInfo {
  cb: number;
  count_total: number;
  results: Result[];
  status: boolean;
  template: string[];
}

export class CamsodaLocator extends LocatorService {
  private readonly ONLINE_RESOURCE = 'https://www.camsoda.com/api/v1/browse/online';
  public async Start() {
    const status = this.IsRunning;
    await super.Start();
    if (status !== this.IsRunning) { Logger.Get.Log('CamsodaLocator::Start()'); }
  }

  public async Stop() {
    await super.Stop();
    if (!this.IsRunning) { Logger.Get.Log('CamsodaLocator::Stop()'); }
  }

  public async Task() {
    if (this.observables.size === 0) {
      return;
    }

    try {
      await this.pauseFence.ExecutionFence();

      const response = await axios.get<OnlineInfo>(this.ONLINE_RESOURCE);
      const streamersIndex = new Set(response.data.results.map(x => x.tpl[1]));

      [...this.observables]
        .filter(x => streamersIndex.has(UsernameFromUrl(x)))
        .forEach(async (x: string) => {
          await this.pauseFence.ExecutionFence();

          const streamUrl = await this.extractor.Extract(x);
          if (streamUrl !== '' && streamUrl !== null) {
            this.Notify({ url: x, streamUrl });
          }
        });
    } catch (e) {
      if (isAxiosError(e)) { Logger.Get.Log(e.message); }
    }
  }

  public OnAbort(e: Error) {
    Logger.Get.Log('CamsodaLocator::Stop() with ' + e);
  }
}
