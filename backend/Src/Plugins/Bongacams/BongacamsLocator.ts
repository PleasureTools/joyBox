import axios from 'axios';

import { UsernameFromUrl } from '../../Common/Util';
import { LocatorService, StreamExtractor } from '../Plugin';

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
    private checkTimer: NodeJS.Timeout | null = null;

    public constructor(
        extractor: StreamExtractor,
        private entry: string = 'http://tools.bongacams.com/promo.php?c=3511&type=api&api_type=json',
        private updatePeriod = 10000) {
        super(extractor);
    }
    public Start(): void {
        if (this.checkTimer === null) {
            Logger.Get.Log('BongacamsLocator::Start()');
            this.Tick();
        }
    }

    public Stop(): void {
        if (!this.IsStarted)
            return;

        Logger.Get.Log('BongacamsLocator::Stop()');
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
            const response = await axios.get<Streamer[]>(this.entry);
            const streamersIndex = new Set(response.data.map(x => x.username));

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
        this.checkTimer = setTimeout(() => this.Tick(), this.updatePeriod);
    }
}
