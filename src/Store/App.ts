/* eslint-disable camelcase */
import Bounds from 'binary-search-bounds';
import { Subject } from 'rxjs';
import { first } from 'rxjs/operators';
import {
  Action,
  Module,
  Mutation,
  VuexModule
} from 'vuex-module-decorators';

import {
  AppStateSnapshot,
  ArchiveTagAction,
  ClipProgress,
  ClipProgressInit,
  ClipProgressState,
  Filter,
  LastSeenInfo,
  Playlist,
  Plugin,
  PluginState,
  RecordingProgressInfo,
  RecordingProgressInit,
  ReorderObservablePluginInfo,
  ReorderPluginInfo,
  SerializedArchiveRecord as ArchiveRecord,
  Stream,
  Streamer,
  UpdateObservableDownload,
  UpdateObservableValidity
} from '@Shared/Types';

interface HasTimestamp {
  timestamp: number;
}

function ArchiveRecordCompByNewest(l: ArchiveRecord, r: ArchiveRecord) { return r.timestamp - l.timestamp; }
function CompByNewest<T extends HasTimestamp>(l: T, r: T) { return r.timestamp - l.timestamp; }
@Module({ name: 'app' })
export default class App extends VuexModule {
  public connected = false;
  public initialized = false;
  public startTime = 0;
  public observables: Stream[] = [];
  public archive: ArchiveRecord[] = [];
  public playlists: Playlist[] = [];
  public archiveFilters: Filter[] = [];
  public observablesFilters: Filter[] = [];
  public clipProgress: ClipProgressState[] = [];
  public plugins: Plugin[] = [];
  public activeRecordings: RecordingProgressInfo[] = [];
  public lastTimeArchiveVisit = 0;
  private OnInitialized = new Subject<void>();
  @Mutation
  public SOCKET_connect(): void {
    this.connected = true;
  }

  @Mutation
  public SOCKET_disconnect(): void {
    this.connected = false;
    this.initialized = false;
  }

  @Mutation
  public SOCKET_Snapshot(snapshot: AppStateSnapshot): void {
    this.observables = snapshot.observables
      .map(s => ({ ...s, plugins: s.plugins.map(pn => (snapshot.plugins.find(p => p.name === pn)) as Plugin) }));
    this.archive = snapshot.archive;
    this.playlists = snapshot.playlists;
    this.clipProgress = snapshot.clipProgress;
    this.archiveFilters = snapshot.archiveFilters;
    this.observablesFilters = snapshot.observablesFilters;
    this.plugins = snapshot.plugins;
    this.activeRecordings = snapshot.activeRecords;
    this.startTime = snapshot.startTime;

    this.initialized = true;
    this.OnInitialized.next();
  }

  @Mutation
  public SOCKET_AddObservable(stream: Streamer): void {
    this.observables
      .push({ ...stream, plugins: stream.plugins.map(pn => (this.plugins.find(p => p.name === pn)) as Plugin) });
  }

  @Mutation
  public SOCKET_RemoveObservable(url: string): void {
    const n = this.observables.findIndex(x => x.uri.toLowerCase() === url.toLowerCase());
    n >= 0 && this.observables.splice(n, 1);
  }

  @Mutation
  public SOCKET_UpdateObservableDownload([url, download]: UpdateObservableDownload): void {
    const o = this.observables.find(x => x.uri === url);
    o && (o.download = download);
  }

  @Mutation
  public SOCKET_UpdateObservableValidity([url, validity]: UpdateObservableValidity): void {
    const o = this.observables.find(x => x.uri === url);
    o && (o.valid = validity);
  }

  @Mutation
  public SOCKET_UpdateLastSeen(info: LastSeenInfo): void {
    const o = this.observables.find(x => x.uri === info.url);
    if (!o) return;
    o.lastSeen = info.lastSeen;
  }

  @Mutation
  public SOCKET_ReorderObservablePlugin([url, oldIndex, newIndex]: ReorderObservablePluginInfo): void {
    const observable = this.observables.find(o => o.uri === url) as Stream;
    observable.plugins.splice(newIndex, 0, observable.plugins.splice(oldIndex, 1)[0]);
  }

  @Mutation
  public SOCKET_ReorderPlugin([from, to]: ReorderPluginInfo): void {
    this.plugins.splice(to, 0, this.plugins.splice(from, 1)[0]);
  }

  @Mutation
  public SOCKET_EnablePlugin([id, enabled]: PluginState): void {
    const plugin = this.plugins.find(x => x.id === id);
    plugin && (plugin.enabled = enabled);
  }

  @Mutation
  public SOCKET_AddActiveRecord(info: RecordingProgressInit): void {
    this.activeRecordings.push({ ...info, time: 0, bitrate: 0, size: 0, paused: false });
  }

  @Mutation
  public SOCKET_RecordingProgress(progress: RecordingProgressInfo): void {
    const record = this.activeRecordings.find(r => r.label === progress.label);

    if (record === undefined) {
      return;
    }

    record.bitrate = progress.bitrate;
    record.time = progress.time;
    record.size = progress.size;
    record.paused = progress.paused;
  }

  @Mutation
  public SOCKET_RemoveRecording(url: string): void {
    const rmIdx = this.activeRecordings.findIndex(x => x.label === url);

    if (rmIdx === -1) {
      return;
    }

    this.activeRecordings.splice(rmIdx, 1);
  }

  @Mutation
  public SOCKET_AddArchiveRecord(record: ArchiveRecord): void {
    const clipIdx = this.clipProgress.findIndex(x => x.label === record.filename);

    if (clipIdx !== -1) { this.clipProgress.splice(clipIdx, 1); }

    this.archive.push(record);
  }

  @Mutation
  public SOCKET_RemoveArchiveRecord(filename: string): void {
    const rmIdx = this.archive.findIndex(x => x.filename === filename);

    if (rmIdx === -1) { return; }

    this.archive.splice(rmIdx, 1);
  }

  @Mutation
  public SOCKET_AddArchiveFilter(filter: Filter): void {
    this.archiveFilters.push(filter);
  }

  @Mutation
  public SOCKET_RemoveArchiveFilter(id: number): void {
    const idx = this.archiveFilters.findIndex(x => x.id === id);

    this.archiveFilters.splice(idx, 1);
  }

  @Mutation
  public SOCKET_AddObservablesFilter(filter: Filter): void {
    this.observablesFilters.push(filter);
  }

  @Mutation
  public SOCKET_RemoveObservablesFilter(id: number): void {
    const idx = this.observablesFilters.findIndex(x => x.id === id);

    this.observablesFilters.splice(idx, 1);
  }

  @Mutation
  public SOCKET_AttachTagToArchiveRecord([filename, tag]: ArchiveTagAction): void {
    const record = this.archive.find(x => x.filename === filename);

    if (record) { record.tags.push(tag); }
  }

  @Mutation
  public SOCKET_DetachTagFromArchiveRecord([filename, tag]: ArchiveTagAction): void {
    const record = this.archive.find(x => x.filename === filename);

    if (!record) return;

    const tid = record.tags.findIndex(x => x === tag);

    if (tid !== -1) { record.tags.splice(tid, 1); }
  }

  @Mutation
  public SOCKET_AddClipProgress(clip: ClipProgressInit): void {
    this.clipProgress.push({ ...clip, progress: 0, eta: 0 });
  }

  @Mutation
  public SOCKET_RemoveClipProgress(label: string): void {
    const clipIdx = this.clipProgress.findIndex(x => x.label === label);

    if (clipIdx !== -1) { this.clipProgress.splice(clipIdx, 1); }
  }

  @Mutation
  public SOCKET_ClipProgress(clip: ClipProgress): void {
    const target = this.clipProgress.find(x => x.label === clip.label);

    if (!target) { return; }

    target.progress = clip.progress;
    target.eta = clip.eta;
  }

  @Mutation
  public SOCKET_LockRecord(label: string): void {
    const found = this.archive.find(x => x.filename === label);
    if (!found) return;
    found.locked = true;
  }

  @Mutation
  public SOCKET_UnlockRecord(label: string): void {
    const found = this.archive.find(x => x.filename === label);
    if (!found) return;
    found.locked = false;
  }

  @Mutation
  public SOCKET_CreatePlaylist(playlist: Playlist): void {
    this.playlists.push(playlist);
  }

  @Mutation
  public SOCKET_RemovePlaylist(id: number): void {
    const idx = this.playlists.findIndex(x => x.id === id);

    if (idx >= 0) {
      this.playlists.splice(idx, 1);
    }
  }

  @Mutation
  public UpdateLastTimeArchiveVisit(): void {
    this.lastTimeArchiveVisit = Math.floor(Date.now() / 1000);
  }

  @Action
  public async AwaitInitialization(timeout: number): Promise<void> {
    return this.initialized ? Promise.resolve() :
      new Promise<void>((ret, err) => {
        const tid = setTimeout(() => err(), timeout);
        this.OnInitialized
          .pipe(first())
          .subscribe(x => ((clearTimeout(tid), ret())));
      });
  }

  public get TotalObservables(): number {
    return this.observables.length;
  }

  public get RecordsByNewest(): ArchiveRecord[] {
    return [...this.archive].sort(ArchiveRecordCompByNewest);
  }

  public get PlaylistsByNewest(): Playlist[] {
    return [...this.playlists].sort(CompByNewest);
  }

  public get NewRecordsCount(): number {
    const needle = {
      title: '',
      source: '',
      timestamp: this.lastTimeArchiveVisit,
      duration: -1,
      size: -1,
      reencoded: false,
      filename: '',
      tags: [],
      locked: false
    };
    return Bounds.gt(this.RecordsByNewest, needle, ArchiveRecordCompByNewest);
  }

  public get ArchiveTotalRecords(): number {
    return this.archive.length;
  }

  public get ArchiveTotalDuration(): number {
    return this.archive.reduce((duration: number, record: ArchiveRecord) => duration + record.duration, 0);
  }

  public get TotalActiveRecordings(): number {
    return this.activeRecordings.length;
  }

  public get ArchiveSize(): number {
    return this.archive.reduce((size, x) => size + x.size, 0);
  }

  public get ActiveRecordingsSize(): number {
    return this.activeRecordings.reduce((size, x) => size + x.size, 0);
  }

  public get NetworkUtilization(): number {
    const Bitrate = (x: RecordingProgressInfo) => x.paused ? 0 : x.bitrate;
    return this.activeRecordings.reduce((speed: number, ar: RecordingProgressInfo) => speed + Bitrate(ar), 0);
  }
}
