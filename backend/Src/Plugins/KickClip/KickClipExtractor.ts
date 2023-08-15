import { StreamExtractor } from '../Plugin';

export class KickClipExtractor implements StreamExtractor {
  public async Extract(url: string): Promise<string | null> {
    return '';
  }

  public CanParse(uri: string): boolean {
    return uri.startsWith('https://kick.com/categories');
  }
}
