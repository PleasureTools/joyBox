/* eslint-disable camelcase */
import { HttpClient } from '../HttpClient/HttpClient';

interface ClipCategory {
  banner: string;
  id: number;
  name: string;
  parent_category: string;
  responsive: string;
  slug: string;
}

interface ClipChannel {
  id: number;
  profile_picture: string;
  slug: string;
  username: string;
}

interface ClipCreator {
  id: number;
  profile_picture: string;
  slug: string;
  username: string;
}

type ClipPrivacy = 'CLIP_PRIVACY_PUBLIC';

export interface Clip {
  category: ClipCategory;
  category_id: string;
  channel: ClipChannel;
  channel_id: number;
  clip_url: string;
  created_at: string;
  creator: ClipCreator;
  duration: number;
  id: string;
  is_mature: boolean;
  liked: boolean;
  likes: number;
  likes_count: number;
  livestream_id: string;
  privacy: ClipPrivacy;
  started_at: string;
  thumbnail_url: string;
  title: string;
  user_id: number;
  video_url: string;
  view_count: number;
  views: number;
}

interface ClipApiResponse {
  clips: Clip[];
  nextCursor?: string;
}

type ClipSortOrder = 'view' | 'date' | 'like';

type ClipTimeframe = 'day' | 'week' | 'month' | 'all';

export class KickApi {
  private httpClient!: HttpClient

  constructor(private entry: string) { }

  set HttpClient(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async Clips(category: string, sort: ClipSortOrder, time: ClipTimeframe): Promise<Clip[]> {
    const clips: Map<string, Clip> = new Map<string, Clip>();

    let response = await this.FetchClips(category, sort, time, '0');
    response.clips.forEach(x => clips.set(x.id, x));

    while (response.nextCursor) {
      response = await this.FetchClips(category, sort, time, response.nextCursor);
      response.clips.forEach(x => clips.set(x.id, x));
    }

    return [...clips.values()];
  }

  private async FetchClips(category: string, sort: ClipSortOrder, time: ClipTimeframe, cursor: string): Promise<ClipApiResponse> {
    const response = await this.httpClient.Get(`${this.entry}/categories/${category}/clips?cursor=${cursor}&sort=${sort}&time=${time}`);

    return JSON.parse(response);
  }
}
