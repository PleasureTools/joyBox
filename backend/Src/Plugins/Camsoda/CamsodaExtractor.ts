import axios from 'axios';
import * as Url from 'url';

import { UsernameFromUrl } from '../../Common/Util';
import { StreamExtractor } from '../Plugin';

export interface VTokenInfo {
  status: number;
  token: string;
  app: string;
  edge_servers: string[];
  stream_name: string;
  private_servers: string[];
  aspect_ratio: string;
  c2c_server: string;
}

export class CamsodaExtractor implements StreamExtractor {
  private readonly VTOKEN_RESOURCE = 'https://www.camsoda.com/api/v1/video/vtoken/';
  public async Extract(url: string): Promise<string | null> {
    try {
      return await this.ExtractPlaylist(url);
    } catch (e) {
      return null;
    }
  }

  public CanParse(uri: string): boolean {
    const hostname = Url.parse(uri).hostname;

    if (typeof hostname !== 'string') {
      return false;
    }

    return hostname.toLowerCase().endsWith('camsoda.com');
  }

  private async ExtractPlaylist(url: string): Promise<string> {
    const username = UsernameFromUrl(url);
    const vt = await (await axios.get<VTokenInfo>(this.VTOKEN_RESOURCE + username)).data;

    if (vt.status === 0) {
      throw new Error('Server respond an error');
    }

    if (vt.edge_servers.length === 0) { return ''; }

    const host = vt.edge_servers[0];
    return `https://${host}/${vt.stream_name}_v1/index.m3u8?token=${vt.token}`;
  }

  private Prefix(streamName: string) {
    return streamName.includes('/') ?
      streamName :
      '/cam/mp4:' + streamName;
  }

  private Quality(streamName: string) {
    return streamName.includes('/') ?
      '720p' :
      '480p';
  }
}
