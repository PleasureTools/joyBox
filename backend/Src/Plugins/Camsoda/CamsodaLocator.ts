import axios from 'axios';

import { Logger } from '../../Common/Logger';
import { UsernameFromUrl } from '../../Common/Util';
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
    private checkTimer: NodeJS.Timeout | null = null;
    private checkoutPeriod = 10000;

    public Start(): void {
        if (this.checkTimer === null) {
            Logger.Get.Log('CamsodaLocator::Start()');
            this.Tick();
        }
    }
    public Stop(): void {
        if (!this.IsStarted)
            return;

        Logger.Get.Log('CamsodaLocator::Stop()');
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
            const response = await axios.get<OnlineInfo>(this.ONLINE_RESOURCE);
            const streamersIndex = new Set(response.data.results.map(x => x.tpl[1]));

            [...this.observables]
                .filter(x => streamersIndex.has(UsernameFromUrl(x)))
                .forEach(async (x: string) => {
                    const streamUrl = await this.extractor.Extract(x);
                    if (streamUrl !== '') {
                        this.Notify({ url: x, streamUrl });
                    }
                });
        } catch (e) {
            if (e.isAxiosError)
                Logger.Get.Log(e.message);
        }
    }

    private ScheduleNext() {
        this.checkTimer = setTimeout(() => this.Tick(), this.checkoutPeriod);
    }
}
