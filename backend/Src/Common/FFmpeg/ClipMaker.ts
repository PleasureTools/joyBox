import { FFMpegProgress } from 'ffmpeg-progress-wrapper';

import { Event } from '../Event';
import { FFMpegProgressInfo } from './';

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
    private reencode: boolean) {
    const ffmpeg = new FFMpegProgress(this.BuildOptions());
    ffmpeg.on('progress', x => this.progress.Emit(x));
    ffmpeg.once('end', code => this.complete.Emit(code === 0));
  }

  private BuildOptions() {
    return ['-ss', this.begin.toString(),
      '-i', this.source,
      '-t', (this.end - this.begin).toString(),
      ...(this.reencode ? [] : ['-acodec', 'copy', '-vcodec', 'copy']),
      this.dest];
  }
}
