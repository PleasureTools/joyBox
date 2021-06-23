import * as Path from 'path';
import PrettyMs = require('pretty-ms');

import { ArchiveRecord } from '@Shared/Types';
import { AppFacade } from './AppFacade';
import { Event } from './Common/Event';
import { FileNotFoundException, MediaInfo, ThumbnailGenerator } from './Common/FFmpeg';
import { Logger } from './Common/Logger';
import { FileSize, ParseObservableUrl, Timestamp, UsernameFromUrl } from './Common/Util';
import { THUMBNAIL_FOLDER } from './Constants';
import { CompleteInfo, RecordingProgress } from './Services/RecordingService';

export class RecorderListener {
    public readonly CompleteEvent = new Event<CompleteInfo>();
    private readonly fileInfo: MediaInfo = new MediaInfo();
    public constructor(private app: AppFacade) {
        app.Recorder.ProgressEvent.On(e => this.Progress(e));
        app.Recorder.CompleteEvent.On(e => this.Complete(e));
    }
    private Progress(e: RecordingProgress) {
        this.app.Broadcaster.RecordingProgress({
            label: e.label,
            time: e.time,
            bitrate: e.bitrate || 0,
            size: e.size,
            paused: e.paused,
        });
    }
    private async Complete(e: CompleteInfo) {
        // return stream back in watchlist
        this.app.LinkedStreams.Add(e.label);
        this.UpdateLastSeen(e.label);
        // add record to archive
        try {
            const fileInfo = await this.fileInfo.Info(e.filename);

            if (fileInfo === undefined)
                throw new FileNotFoundException();

            const ob = ParseObservableUrl(e.label);
            const title = ob ? `${ob.provider}/${ob.channel}` : e.label;
            const newArchiveRecord: ArchiveRecord = {
                title,
                source: e.label,
                timestamp: Timestamp(),
                duration: Math.round(parseFloat(fileInfo.duration)),
                size: await FileSize(e.filename),
                filename: Path.basename(e.filename),
                locked: false,
                tags: new Set<string>()
            };

            const sourceName = Path.parse(e.filename).name;

            await new ThumbnailGenerator()
                .Generate(e.filename,
                    newArchiveRecord.duration / 10, // 10% from the start
                    Path.join(THUMBNAIL_FOLDER, sourceName));

            this.app.AddArchiveRecord(newArchiveRecord);

            Logger.Get.Log(`New archive record ${Path.basename(e.filename)}`);
            this.app.NotificationCenter.NotifyAll({
                title: UsernameFromUrl(e.label),
                body: PrettyMs(newArchiveRecord.duration * 1000),
                image: `/archive/thumbnail/${sourceName}.jpg`,
                data: { url: `/player/${sourceName}.mp4?notification` }
            });
        } catch (e) {
            // Ignore StreamRecordInfo file not found exception
            if (!(e instanceof FileNotFoundException))
                Logger.Get.Log(e);
        }

        // notify clients
        this.app.Broadcaster.RemoveRecording(e.label);
        this.CompleteEvent.Emit(e);
    }
    private UpdateLastSeen(url: string) {
        const now = Timestamp();
        const target = this.app.Observables.get(url);
        if (!target) return;
        target.lastSeen = now;
        this.app.Storage.UpdateLastSeen(url, now);
        this.app.Broadcaster.UpdateLastSeen({ url, lastSeen: now });
    }
}
