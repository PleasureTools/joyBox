import axios from 'axios';
import * as memoizee from 'memoizee';
import * as Url from 'url';

import { UsernameFromUrl } from '../../Common/Util';
import { StreamExtractor } from '../Plugin';

export interface AdsZoneIds {
    '300x250, centre': string;
    '300x250, right': string;
    '300x250, left': string;
    '468x60': string;
    '160x600, top': string;
    '160x600, bottom': string;
    '160x600, middle': string;
}

export interface ChatSettings {
    sort_users_key: string;
    silence_broadcasters: string;
    highest_token_color: string;
    emoticon_autocomplete_delay: string;
    ignored_users: string;
    show_emoticons: boolean;
    font_size: string;
    b_tip_vol: string;
    allowed_chat: string;
    room_leave_for: string;
    font_color: string;
    font_family: string;
    room_entry_for: string;
    v_tip_vol: string;
}

export interface SatisfactionScore {
    down_votes: number;
    up_votes: number;
    percent: number;
    max: number;
}

export interface RoomInfo {
    allow_group_shows: boolean;
    ads_zone_ids: AdsZoneIds;
    chat_settings: ChatSettings;
    is_age_verified: boolean;
    flash_host: string;
    tips_in_past_24_hours: number;
    dismissible_messages: any[];
    show_mobile_site_banner_link: boolean;
    last_vote_in_past_90_days_down: boolean;
    server_name: string;
    num_users_required_for_group: number;
    group_show_price: number;
    is_mobile: boolean;
    chat_username: string;
    recommender_hmac: string;
    broadcaster_gender: string;
    hls_source: string;
    allow_show_recordings: boolean;
    is_moderator: boolean;
    room_status: string;
    edge_auth: string;
    is_supporter: boolean;
    chat_password: string;
    room_pass: string;
    low_satisfaction_score: boolean;
    tfa_enabled: boolean;
    room_title: string;
    satisfaction_score: SatisfactionScore;
    viewer_username: string;
    hidden_message: string;
    following: boolean;
    wschat_host: string;
    has_studio: boolean;
    num_followed: number;
    spy_private_show_price: number;
    hide_satisfaction_score: boolean;
    broadcaster_username: string;
    ignored_emoticons: any[];
    apps_running: string;
    token_balance: number;
    private_min_minutes: number;
    viewer_gender: string;
    num_users_waiting_for_group: number;
    last_vote_in_past_24_hours?: any;
    is_widescreen: boolean;
    broadcaster_on_new_chat: boolean;
    private_show_price: number;
    num_followed_online: number;
    allow_private_shows: boolean;
}

export class ChaturbateExtractor implements StreamExtractor {
    private ExtractPlaylistMem = memoizee(this.ExtractPlaylist.bind(this), { maxAge: 1000, promise: true });
    public async Extract(url: string): Promise<string> {
        return await this.ExtractPlaylistMem(url);
    }
    public CanParse(uri: string): boolean {
        const hostname = Url.parse(uri).hostname;

        if (typeof hostname !== 'string') {
            return false;
        }

        return hostname.toLowerCase().endsWith('chaturbate.com');
    }

    private async ExtractPlaylist(url: string) {
        const username = UsernameFromUrl(url);
        try {
            const response = await axios.get<RoomInfo>(`https://chaturbate.com/api/chatvideocontext/${username}/`);
            return response.data.hls_source;
        } catch (e) {
            return '';
        }

    }
}
