import { FFMpegProgress } from 'ffmpeg-progress-wrapper';

import { Event } from '../Event';
import { FFMpegProgressInfo } from './';

export class ClipMaker {
    private progress: Event<FFMpegProgressInfo> = new Event();;
    private complete: Event<boolean> = new Event();
    public get Progress() { return this.progress; }
    public get Complete() { return this.complete; }
    public constructor(
        private source: string,
        private begin: number,
        private end: number,
        private dest: string) {
        const ffmpeg = new FFMpegProgress(this.BuildOptions());
        ffmpeg.on('progress', x => this.progress.Emit(x));
        ffmpeg.once('end', code => this.complete.Emit(code === 0));
    }
    private BuildOptions() {
        return ['-ss', this.begin.toString(),
            '-i', this.source,
            '-t', (this.end - this.begin).toString(),
            '-acodec', 'copy',
            '-vcodec', 'copy',
            this.dest];
    }
}
