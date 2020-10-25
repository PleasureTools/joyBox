import axios from 'axios';
import * as Rx from 'rxjs';
import * as Rop from 'rxjs/operators';

import { LocatorService } from '../Plugin';
import { Logger } from './../../Common/Logger';

export class BongacamsDirectLocator extends LocatorService {
    private readonly EMPTY_PLAYLIST_SIZE = 25;
    public async Start() {
        const status = this.IsRunning;
        await super.Start();
        if (status !== this.IsRunning)
            Logger.Get.Log('BongacamsDirectLocator::Start()');
    }
    public async Stop() {
        await super.Stop();
        if (!this.IsRunning)
            Logger.Get.Log('BongacamsDirectLocator::Stop()');
    }
    public async Task() {

        if (this.observables.size === 0) {
            return;
        }

        try {
            Rx.from([...this.observables])
                .pipe(
                    Rop.flatMap(async (x) => ({ url: x, streamUrl: await this.extractor.Extract(x) })),
                    Rop.catchError(x => Rx.of(({ url: x, streamUrl: '' }))),
                    Rop.flatMap(async (x) => ({ ...x, online: await this.IsOnline(x.streamUrl) })),
                    Rop.filter(x => x.online)
                ).subscribe(x => this.Notify(x));
        } catch (e) {
            Logger.Get.Log(e);
        }
    }
    public OnAbort(e: Error) {
        Logger.Get.Log('BongacamsDirectLocator::Stop() with ' + e);
    }
    private async IsOnline(source: string): Promise<boolean> {
        try {
            const response = await axios.get<string>(source);
            const playlistContent = response.data;
            return playlistContent.length !== this.EMPTY_PLAYLIST_SIZE;
        } catch (e) {
            return false;
        }
    }
}
