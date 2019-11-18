import { LiveStream, LocatorService } from '../Plugin';

import * as rp from 'request-promise';

export class BongacamsDirectLocator extends LocatorService {
    private readonly EMPTY_PLAYLIST_SIZE = 25;
    private checkTimer: NodeJS.Timeout | null = null;
    private checkoutPeriod = 10000;

    public Start(): void {
        console.log('BongacamsDirectLocator::Start()');

        if (this.checkTimer === null)
            this.Tick();

    }
    public Stop(): void {
        console.log('BongacamsDirectLocator::Stop()');

        if (!this.IsStarted) {
            return;
        }

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
            console.error(e);
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
            const playlistContent = await rp(ls.streamUrl);
            return playlistContent.length !== this.EMPTY_PLAYLIST_SIZE;
        } catch (e) {
            return false;
        }
    }

    private ScheduleNext() {
        this.checkTimer = setTimeout(() => this.Tick(), this.checkoutPeriod);
    }
}
