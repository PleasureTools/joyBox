import { FFMpegProgress } from 'ffmpeg-progress-wrapper';

import { Event } from '../Event';
import { FFMpegProgressInfo } from './';

export enum ReencodingMode { Copy, Software, Hardware }

export class ClipMaker {
  private progress: Event<FFMpegProgressInfo> = new Event();
  private complete: Event<boolean> = new Event();
  public get Progress(): Event<FFMpegProgressInfo> { return this.progress; }
  public get Complete(): Event<boolean> { return this.complete; }
  public constructor(
    private source: string,
    private begin: number,
    private end: number,
    private dest: string,
    private reencode: ReencodingMode) {
    const ffmpeg = new FFMpegProgress(this.BuildOptions());
    ffmpeg.on('progress', x => this.progress.Emit(x));
    ffmpeg.once('end', code => this.complete.Emit(code === 0));
  }

  private BuildOptions() {
    return ['-ss', this.begin.toString(),
      '-i', this.source,
      '-t', (this.end - this.begin).toString(),
      ...this.ReencodeOptions,
      this.dest];
  }

  private get ReencodeOptions(): string[] {
    switch (this.reencode) {
      case ReencodingMode.Copy:
        return ['-acodec', 'copy', '-vcodec', 'copy'];
      case ReencodingMode.Software:
        return [];
      case ReencodingMode.Hardware:
        return ['-vcodec', 'h264_nvenc'];
    }
  }
}
