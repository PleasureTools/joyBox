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
    public async Extract(url: string): Promise<string> {
        try {
            return this.ExtractPlaylist(url);
        } catch (e) {
            return '';
        }
    }
    public CanParse(uri: string): boolean {
        const hostname = Url.parse(uri).hostname;

        if (typeof hostname !== 'string') {
            return false;
        }

        return hostname.toLowerCase().endsWith('camsoda.com');
    }
    private async ExtractPlaylist(url: string) {
        const username = UsernameFromUrl(url);
        const vt = await (await axios.get<VTokenInfo>(this.VTOKEN_RESOURCE + username)).data;

        if (vt.edge_servers.length === 0)
            return '';

        const host = vt.edge_servers[0];
        return `https://${host}/${this.Prefix(vt.stream_name)}_h264_aac_${this.Quality(vt.stream_name)}/index.m3u8?token=${vt.token}`;
    }
    private Prefix(streamName: string) {
        return streamName.includes('/') ?
            streamName :
            '/cam/mp4:' + streamName;
    }
    private Quality(streamName: string) {
        return streamName.includes('/') ?
            '720p' :
            '480p'
    }
}
