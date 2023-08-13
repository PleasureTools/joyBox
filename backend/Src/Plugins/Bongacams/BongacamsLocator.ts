/* eslint-disable camelcase */
import axios, { AxiosError } from 'axios';

import { isAxiosError, UsernameFromUrl } from '../../Common/Util';
import { LocatorService } from '../Plugin';

import { Logger } from './../../Common/Logger';

interface ProfileImage {
  profile_image: string;
  thumbnail_image_small: string;
  thumbnail_image_medium: string;
  thumbnail_image_big: string;
  thumbnail_image_small_live: string;
  thumbnail_image_medium_live: string;
  thumbnail_image_big_live: string;
}

interface Streamer {
  username: string;
  display_name: string;
  display_age: string;
  profile_images: ProfileImage;
  chat_url: string;
  random_chat_url: string;
  popular_chat_url: string;
  chat_url_on_home_page: string;
  direct_chat_url: string;
  profile_page_url: string;
  online_time: number;
  chat_status: string;
  marker: string;
  status: boolean;
  hometown: string;
  turns_on: string;
  turns_off: string;
  signup_date: string;
  last_update_date: string;
  members_count: number;
  vibratoy: boolean;
  hd_cam: boolean;
  primary_language_key: string;
  secondary_language_key: string;
  gender: string;
  height: string;
  weight: string;
  ethnicity: string;
  hair_color: string;
  eye_color: string;
  bust_penis_size: string;
  pubic_hair: string;
  primary_language: string;
  secondary_language: string;
  embed_chat_url: string;
  is_geo: boolean;
}
export class BongacamsLocator extends LocatorService {
  private readonly ONLINE_ENDPOINT = 'http://tools.bongacams.com/promo.php?c=3511&type=api&api_type=json';
  public async Start(): Promise<void> {
    const status = this.IsRunning;
    await super.Start();
    if (status !== this.IsRunning) { Logger.Get.Log('BongacamsLocator::Start()'); }
  }

  public async Stop(): Promise<void> {
    await super.Stop();
    if (!this.IsRunning) { Logger.Get.Log('BongacamsLocator::Stop()'); }
  }

  public async Task(): Promise<void> {
    if (this.observables.size === 0) {
      return;
    }

    try {
      await this.pauseFence.ExecutionFence();

      const response = await axios.get<Streamer[]>(this.ONLINE_ENDPOINT);
      const streamersIndex = new Set(response.data.map(x => x.username.toLowerCase()));

      [...this.observables]
        .filter(x => streamersIndex.has(UsernameFromUrl(x).toLowerCase()))
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

  public OnAbort(e: Error): void {
    Logger.Get.Log('BongacamsLocator::Stop() with ' + e);
  }
}
