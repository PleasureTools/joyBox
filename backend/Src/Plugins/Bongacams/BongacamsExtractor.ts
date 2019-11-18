import * as rp from 'request-promise';
import * as Url from 'url';
import { UsernameFromUrl } from '../../Common/Util';
import { StreamExtractor } from '../Plugin';

export interface UserData {
    username: string;
    displayName: string;
    location: string;
    chathost: string;
    isRu: boolean;
}

export interface LocalData {
    dataKey: string;
    NC_AccessSalt: string;
    NC_AccessKey: string;
    vsid: string;
    videoServerUrl: string;
}

export interface MessageStyle {
    color: string;
    fontFamily: string;
    fontSize: string;
}

export interface DmcaSecurity {
    image: string;
    width: number;
    height: number;
    marginTop: number;
    marginLeft: number;
}

export interface PerformerData {
    userId: number;
    username: string;
    displayName: string;
    friendRequestSettings: string;
    messageStyle: MessageStyle;
    hasProfile: boolean;
    sexType: string;
    showType: string;
    gender: string;
    avatarUrl: string;
    isRu: boolean;
    videoQuality: string;
    loversCount: number;
    dmcaSecurity: DmcaSecurity;
    sessionTs: number;
}

export interface RoomInfo {
    status: string;
    userData: UserData;
    localData: LocalData;
    performerData: PerformerData;
}

export class BongacamsExtractor implements StreamExtractor {
    public async Extract(uri: string): Promise<string> {
        try {
            return await this.ExtractPlaylist(uri);
        } catch (e) {
            return '';
        }
    }
    public CanParse(uri: string): boolean {
        const hostname = Url.parse(uri).hostname;

        if (typeof hostname !== 'string') {
            return false;
        }

        return hostname.toLowerCase().endsWith('bongacams.com');
    }

    private async ExtractPlaylist(uri: string) {
        const username = UsernameFromUrl(uri);
        const body = `method=getRoomData&args[]=${username}&args[]=true`;

        const info: RoomInfo = await rp({
            body,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'x-requested-with': 'XMLHttpRequest'
            },
            json: true,
            method: 'POST',
            uri: 'https://bongacams.com/tools/amf.php'
        });

        return `https:${info.localData.videoServerUrl}/hls/stream_${username}/playlist.m3u8`;
    }
}
