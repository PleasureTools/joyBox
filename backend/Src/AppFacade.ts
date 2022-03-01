import * as Path from 'path';

import { ArchiveRecord, Playlist } from '@Shared/Types';
import { Broadcaster } from './ClientIO/Broadcaster';
import { ObservableStream } from './Common/Types';
import { NotificationCenter } from './Services/NotificationCenter';
import { PluginManager } from './Services/PluginManager';
import { RecordingService } from './Services/RecordingService';
import { SqliteAdapter } from './Services/SqliteAdapter';
import { StreamDispatcher } from './StreamDispatcher';
import { THUMBNAIL_FOLDER } from './Constants';
import { MediaInfo, ThumbnailGenerator } from './Common/FFmpeg';
import { FileSize, Timestamp } from './Common/Util';
import { SizeQuotaNotifier } from './Services/SizeQuotaNotifier';
import { ExtractorWithCache } from './Plugins/ExtractorWithCache';

export class AppFacade {
  public constructor(
    private storage: SqliteAdapter,
    private broadcaster: Broadcaster,
    private observables: Map<string, ObservableStream>,
    private archive: ArchiveRecord[],
    private playlists: Playlist[],
    private pluginManager: PluginManager,
    private linkedStreams: StreamDispatcher,
    private recorder: RecordingService,
    private notificationCenter: NotificationCenter,
    private sizeQuotaNotifier: SizeQuotaNotifier,
    private playlistExtractor: ExtractorWithCache) { }

  public get Storage(): SqliteAdapter {
    return this.storage;
  }

  public get Broadcaster(): Broadcaster {
    return this.broadcaster;
  }

  public get Archive(): ArchiveRecord[] {
    return this.archive;
  }

  public get Playlists(): Playlist[] {
    return this.playlists;
  }

  public get PluginManager(): PluginManager {
    return this.pluginManager;
  }

  public get LinkedStreams(): StreamDispatcher {
    return this.linkedStreams;
  }

  public get Recorder(): RecordingService {
    return this.recorder;
  }

  public get NotificationCenter(): NotificationCenter {
    return this.notificationCenter;
  }

  public get Observables(): Map<string, ObservableStream> {
    return this.observables;
  }

  public get SizeQuotaNotifier(): SizeQuotaNotifier {
    return this.sizeQuotaNotifier;
  }

  public get PlaylistExtractor(): ExtractorWithCache {
    return this.playlistExtractor;
  }

  /**
     * Add video to archive. File must be already in archive folder
     * @param filename filename
     * @param title title
     * @param source source of video
     * @returns True if the video was added successfully
     */
  public async AddToArchive(filename: string, title: string, source: string): Promise<boolean> {
    const mediaInfo = new MediaInfo();
    const thumbnail = new ThumbnailGenerator();

    try {
      const fileInfo = await mediaInfo.Info(filename);

      if (fileInfo === undefined) { return false; }

      const duration = Math.round(parseFloat(fileInfo.duration));
      const filenameObj = Path.parse(filename);

      await thumbnail
        .Generate(filename,
          duration / 10, // 10% from the start
          Path.join(THUMBNAIL_FOLDER, filenameObj.name));

      this.AddArchiveRecord({
        title,
        source,
        timestamp: Timestamp(),
        duration,
        size: await FileSize(filename),
        reencoded: false,
        filename: filenameObj.base,
        locked: false,
        tags: new Set<string>()
      });
    } catch (e) {
      return false;
    }

    return true;
  }

  public AddArchiveRecord(record: ArchiveRecord): void {
    this.archive.push(record);

    this.storage.AddArchiveRecord(record);

    this.broadcaster.AddArchiveRecord({ ...record, tags: [...record.tags] });
  }

  public UpdateObservableDownload(url: string, download: number): boolean {
    const observableDownload = this.storage.UpdateObservableDownload(url, download);

    if (observableDownload === -1) {
      return false;
    }

    const o = this.observables.get(url);
    o && (o.download = observableDownload);

    this.broadcaster.UpdateObservableDownload(url, observableDownload);

    return true;
  }
}
