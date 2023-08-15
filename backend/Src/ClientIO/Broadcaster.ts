import * as socketIo from 'socket.io';

import {
  ClipProgress,
  ClipProgressInit,
  Exact,
  Filter,
  LastSeenInfo,
  PluginState,
  RecordingProgressUpdate,
  RecordingProgressInit,
  ReorderObservablePluginInfo,
  ReorderPluginInfo,
  SerializedArchiveRecord,
  Streamer,
  SystemInfo,
  Playlist
} from '@Shared/Types';

export class Broadcaster {
  public constructor(private io: socketIo.Server) { }
  // Channel
  public AddObservable(observable: Streamer): void {
    this.io.emit('AddObservable', observable);
  }

  public RemoveObservable(url: string): void {
    this.io.emit('RemoveObservable', url);
  }

  public ReorderObservablePlugin(stream: ReorderObservablePluginInfo): void {
    this.io.emit('ReorderObservablePlugin', stream);
  }

  public UpdateLastSeen<T>(info: Exact<T, LastSeenInfo>): void {
    this.io.emit('UpdateLastSeen', info);
  }

  public UpdateObservableDownload(url: string, download: number): void {
    this.io.emit('UpdateObservableDownload', url, download);
  }

  public UpdateObservableValidity(url: string, validity: boolean): void {
    this.io.emit('UpdateObservableValidity', url, validity);
  }

  // Plugin
  public EnablePlugin(target: PluginState): void {
    this.io.emit('EnablePlugin', target);
  }

  public RedorderPlugin(transition: ReorderPluginInfo): void {
    this.io.emit('ReorderPlugin', transition);
  }

  // Recording
  public NewRecording<T>(info: Exact<T, RecordingProgressInit>): void {
    this.io.emit('AddActiveRecord', info);
  }

  public RecordingProgress<T>(progress: Exact<T, RecordingProgressUpdate>): void {
    this.io.emit('RecordingProgress', progress);
  }

  public RemoveRecording(source: string): void {
    this.io.emit('RemoveRecording', source);
  }

  // Archive
  public AddArchiveRecord(record: SerializedArchiveRecord): void {
    this.io.emit('AddArchiveRecord', record);
  }

  public RemoveArchiveRecord(filename: string): void {
    this.io.emit('RemoveArchiveRecord', filename);
  }

  public LockRecord(filename: string): void {
    this.io.emit('LockRecord', filename);
  }

  public UnlockRecord(filename: string): void {
    this.io.emit('UnlockRecord', filename);
  }

  public AttachTagToArchiveRecord(filename: string, tag: string): void {
    this.io.emit('AttachTagToArchiveRecord', filename, tag);
  }

  public DetachTagFromArchiveRecord(filename: string, tag: string): void {
    this.io.emit('DetachTagFromArchiveRecord', filename, tag);
  }

  public AddArchiveFilter<T>(filter: Exact<T, Filter>): void {
    this.io.emit('AddArchiveFilter', filter);
  }

  public RemoveArchiveFilter(id: number): void {
    this.io.emit('RemoveArchiveFilter', id);
  }

  public AddObservablesFilter<T>(filter: Exact<T, Filter>): void {
    this.io.emit('AddObservablesFilter', filter);
  }

  public RemoveObservablesFilter(id: number): void {
    this.io.emit('RemoveObservablesFilter', id);
  }

  // Clip
  public NewClipProgress<T>(info: Exact<T, ClipProgressInit>): void {
    this.io.emit('AddClipProgress', info);
  }

  public ClipProgress<T>(info: Exact<T, ClipProgress>): void {
    this.io.emit('ClipProgress', info);
  }

  public RemoveClipProgress(filename: string): void {
    this.io.emit('RemoveClipProgress', filename);
  }

  // System monitor
  public SystemMonitorUpdate<T>(info: Exact<T, SystemInfo>): void {
    this.io.emit('SystemMonitorUpdate', info);
  }

  // Non specific
  public UpdateStorageQuota(quota: number): void {
    this.io.emit('UpdateStorageQuota', quota);
  }

  public UpdateInstanceQuota(quota: number): void {
    this.io.emit('UpdateInstanceQuota', quota);
  }

  public UpdateDownloadSpeedQuota(quota: number): void {
    this.io.emit('UpdateDownloadSpeedQuota', quota);
  }

  public UpdateRemoteSeleniumUrl(url: string): void {
    this.io.emit('UpdateRemoteSeleniumUrl', url);
  }

  public CreatePlaylist(playlist: Playlist): void {
    this.io.emit('CreatePlaylist', playlist);
  }

  public RemovePlaylist(id: number): void {
    this.io.emit('RemovePlaylist', id);
  }
}
