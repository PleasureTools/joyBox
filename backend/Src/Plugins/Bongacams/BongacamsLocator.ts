import { UsernameFromUrl } from '../../Common/Util';
import { LocatorService } from '../Plugin';

import * as rp from 'request-promise';
import { StatusCodeError } from 'request-promise/errors';

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
    private readonly ONLIVE_ENTRY = 'http://tools.bongacams.com/promo.php?c=3511&type=api&api_type=json';
    private checkTimer: NodeJS.Timeout | null = null;
    private checkoutPeriod = 10000;

    public Start(): void {
        console.log('BongacamsLocator::Start()');

        if (this.checkTimer === null) {
            this.Tick();
        }
    }

    public Stop(): void {
        console.log('BongacamsLocator::Stop()');

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
            const onliveStreamers: Streamer[] = await rp(this.ONLIVE_ENTRY, { json: true });
            const streamersIndex = new Set(onliveStreamers.map(x => x.username));

            [...this.observables]
                .filter(x => streamersIndex.has(UsernameFromUrl(x)))
                .forEach(async (x: string) => {
                    const streamUrl = await this.extractor.Extract(x);
                    if (streamUrl !== '') {
                        this.Notify({ url: x, streamUrl });
                    }
                });
        } catch (e) {
            if (e instanceof StatusCodeError)
                console.error(`BongacamsLocator: Can't fetch online list.`);
        }
    }

    private ScheduleNext() {
        this.checkTimer = setTimeout(() => this.Tick(), this.checkoutPeriod);
    }
}
