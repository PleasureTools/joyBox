import axios from 'axios';

import { LiveStream, LocatorService } from '../Plugin';
import { Logger } from './../../Common/Logger';

export class BongacamsDirectLocator extends LocatorService {
    private readonly EMPTY_PLAYLIST_SIZE = 25;
    private checkTimer: NodeJS.Timeout | null = null;
    private checkoutPeriod = 10000;

    public Start(): void {
        if (this.checkTimer === null) {
            Logger.Get.Log('BongacamsDirectLocator::Start()');
            this.Tick();
        }
    }
    public Stop(): void {
        if (!this.IsStarted)
            return;

        Logger.Get.Log('BongacamsDirectLocator::Stop()');
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

        try {
            (await (await this.FilterPlaylist((await this.MapPlaylist([...this.observables])))))
                .forEach(x => this.Notify(x));
        } catch (e) {
            Logger.Get.Log(e);
        }
    }

    private async MapPlaylist(observables: string[]): Promise<LiveStream[]> {
        const ret = [];
        for await (const url of observables) {
            try {
                ret.push({ url, streamUrl: await this.extractor.Extract(url) });
            } catch (e) {
                ret.push({ url, streamUrl: '' });
            }
        }
        return ret;
    }

    private async FilterPlaylist(lsl: LiveStream[]): Promise<LiveStream[]> {
        const ret = [];
        for await (const ls of lsl) {
            if (await this.IsOnline(ls))
                ret.push(ls);
        }
        return ret;
    }

    private async IsOnline(ls: LiveStream): Promise<boolean> {
        try {
            const response = await axios.get<string>(ls.streamUrl);
            const playlistContent = response.data;
            return playlistContent.length !== this.EMPTY_PLAYLIST_SIZE;
        } catch (e) {
            return false;
        }
    }

    private ScheduleNext() {
        this.checkTimer = setTimeout(() => this.Tick(), this.checkoutPeriod);
    }
}
