import { URL } from 'url';

import { Browser } from 'selenium-webdriver';

import { LocatorService, StreamExtractor } from '../Plugin';
import { Logger } from './../../Common/Logger';
import { RemoteSeleniumHttpClient } from '@/HttpClient/RemoteSeleniumHttpClient';
import { Clip, KickApi } from '@/Kick/KickApi';

type RemoteSeleniumUrlFetcher = () => string;

interface ClipQueue {
  lastClipCreatedAt: number;
  pendingClips: Clip[];
}

export class KickClipLocator extends LocatorService {
  private readonly pendingQueuePeriod = 10000;

  private readonly emptyQueuePeriod = 300000;

  private readonly now = Date.now();

  private categoryClipQueue = new Map<string, ClipQueue>();

  private api = new KickApi('https://kick.com/api/v2');

  constructor(
    extractor: StreamExtractor,
    updatePeriod: number,
    private proxyUrlFetcher: RemoteSeleniumUrlFetcher) {
    super(extractor, updatePeriod);
  }

  public async Start(): Promise<void> {
    const status = this.IsRunning;
    await super.Start();
    if (status !== this.IsRunning) { Logger.Get.Log('KickClipLocator::Start()'); }
  }

  public async Stop(): Promise<void> {
    await super.Stop();
    if (!this.IsRunning) { Logger.Get.Log('KickClipLocator::Stop()'); }
  }

  public async Task(): Promise<void> {
    if (this.observables.size === 0 || this.proxyUrlFetcher() === '') {
      return;
    }

    let browser: RemoteSeleniumHttpClient | null = null;

    for (const categoryUrl of this.observables) {
      await this.pauseFence.ExecutionFence();

      const category = new URL(categoryUrl).pathname.split('/').slice(-1)[0];
      let clipQueue = this.categoryClipQueue.get(category);

      if (clipQueue && clipQueue.pendingClips.length > 0) {

      } else {
        try {
          if (browser === null) {
            browser = await RemoteSeleniumHttpClient.Create(this.proxyUrlFetcher(), Browser.FIREFOX);
            this.api.HttpClient = browser;
          }
        } catch (e) {
          return;
        }

        const sinse = clipQueue ? clipQueue.lastClipCreatedAt : this.now;

        let allClips: Clip[] = [];
        try {
          allClips = await this.api.Clips(category, 'date', 'day');
        } catch (e) {
          browser.Dispose();
          browser = null;
        }

        const clips = allClips
          .filter(x => new Date(x.created_at).getTime() > sinse)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        if (clips.length === 0) {
          continue;
        }

        if (clipQueue) {
          clipQueue.lastClipCreatedAt = 0;
          clipQueue.pendingClips = clips;
        } else {
          clipQueue = { lastClipCreatedAt: 0, pendingClips: clips };
          this.categoryClipQueue.set(category, clipQueue);
        }
      }

      if (clipQueue.pendingClips.length > 0) {
        const clip = clipQueue.pendingClips.pop();

        clipQueue.lastClipCreatedAt = new Date(clip!.created_at).getTime();

        this.Notify({ url: categoryUrl, streamUrl: clip!.video_url });
      }
    }

    this.period = [...this.categoryClipQueue.values()]
      .some(x => x.pendingClips.length > 0) ? this.pendingQueuePeriod : this.emptyQueuePeriod;

    await browser?.Dispose();
    browser = null;
  }

  public OnAbort(e: Error): void {
    Logger.Get.Log('KickClipLocator::Stop() with ' + e);
  }
}
