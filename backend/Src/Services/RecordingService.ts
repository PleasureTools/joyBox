import { FFMpegProgress } from 'ffmpeg-progress-wrapper';
import * as Path from 'path';

import { Event, Observable, ThrottleEvent } from '../Common/Event';
import { FFMpegProgressInfo } from '../Common/FFmpeg';
import { SizeStrToByte } from '../Common/Util';

interface RecordingProgress {
   label: string;
   time: number;
   bitrate: number;
   size: number;
   paused: boolean;
   filename: string;
}
interface RecordingProcess {
   instance: FFMpegProgress;
   progress: RecordingProgress;
}

export interface CompleteInfo {
   label: string;
   filename: string;
}

export class RecordingService {
   private recorderInstances: Map<string, RecordingProcess> = new Map();

   private progressEvent: Event<RecordingProgress> = new Event();
   private completeEvent: Event<CompleteInfo> = new Event();

   public get ProgressEvent(): Observable<RecordingProgress> {
      return this.progressEvent;
   }

   public get CompleteEvent(): Observable<CompleteInfo> {
      return this.completeEvent;
   }

   public get Records(): RecordingProgress[] {
      return [...this.recorderInstances.values()].map(r => r.progress);
   }

   public StartRecording(label: string, url: string, outputFilename: string) {
      const instance = new FFMpegProgress(this.BuildOptions(url, outputFilename));
      const progress = { label, time: 0, bitrate: 0, size: 0, paused: false, filename: Path.basename(outputFilename) };
      const process: RecordingProcess = { instance, progress };
      this.recorderInstances.set(label, process);
      const innerEmiter = new ThrottleEvent<RecordingProgress>(1000);
      innerEmiter.On(x => {
         process.progress = x;
         this.progressEvent.Emit(x);
      }
      );
      instance.on('progress', (p: FFMpegProgressInfo) => {
         const info: RecordingProgress = {
            bitrate: SizeStrToByte(p.bitrate.slice(0, -3)),
            label,
            size: SizeStrToByte(p.size || p.Lsize),
            time: p.time,
            paused: p.time === process.progress.time,
            filename: process.progress.filename
         };
         innerEmiter.Emit(info);
      });

      instance.process.once('close', () => {
         this.completeEvent.Emit({ label, filename: outputFilename });

         instance.removeAllListeners();
         this.recorderInstances.delete(label);
      });
   }

   public StopRecording(label: string): boolean {
      const process = this.recorderInstances.get(label);

      if (process === undefined) {
         return false;
      }

      process.instance.removeAllListeners();

      this.TerminateInstance(process.instance);
      return this.recorderInstances.delete(label);
   }

   private TerminateInstance(instance: FFMpegProgress) {
      if (instance.process.stdin != null) {
         instance.process.stdin.write('q');
      }
   }

   private BuildOptions(source: string, dest: string) {
      return ['-max_reload', '10', '-i', source, '-acodec', 'copy', '-vcodec', 'copy', dest];
   }
}
