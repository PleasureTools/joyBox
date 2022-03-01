import * as LruCache from 'lru-cache';

import { StreamExtractor } from './Plugin';

export class ExtractorWithCache implements StreamExtractor {
  private cache = new LruCache<string, string>({ max: 50, maxAge: 10 * 1000 });
  private nextExtractor: StreamExtractor | null= null;

  public constructor(private extractor: StreamExtractor) {}

  public Next(extractor: ExtractorWithCache): ExtractorWithCache {
    this.nextExtractor = extractor;
    return extractor;
  }

  public CanParse(uri: string): boolean {
    return this.extractor.CanParse(uri);
  }

  public async Extract(uri: string): Promise<string | null> {
    if (this.CanParse(uri)) {
      const playlistUrl = this.cache.get(uri);
      if (playlistUrl) {
        return playlistUrl;
      }

      const reqPlaylistUrl = await this.extractor.Extract(uri);

      if (reqPlaylistUrl === null) {
        return null;
      }

      this.cache.set(uri, reqPlaylistUrl);

      return reqPlaylistUrl;
    } else if (this.nextExtractor) {
      return this.nextExtractor.Extract(uri);
    } else {
      return '';
    }
  }
}
