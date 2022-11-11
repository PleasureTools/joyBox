/* eslint-disable camelcase */
import axios from 'axios';
import { URL } from 'url';
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
  public async Extract(uri: string): Promise<string | null> {
    try {
      return await this.ExtractPlaylist(uri);
    } catch (e) {
      return null;
    }
  }

  public CanParse(uri: string): boolean {
    const hostname = new URL(uri).hostname;

    if (typeof hostname !== 'string') {
      return false;
    }

    return hostname.toLowerCase().endsWith('bongacams.com');
  }

  private async ExtractPlaylist(uri: string): Promise<string> {
    const username = UsernameFromUrl(uri);
    const body = `method=getRoomData&args[]=${username}&args[]=true`;

    const headers = {
      'x-requested-with': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; rv:20.0) Gecko/20121202 Firefox/20.0'
    };

    const response = await axios.post<RoomInfo>('https://bongacams.com/tools/amf.php', body, { headers });
    const info = response.data;

    if (info.status === 'error') {
      throw new Error('Server respond an error');
    }

    return `https:${info.localData.videoServerUrl}/hls/stream_${info.performerData.username}/playlist.m3u8`;
  }
}
