import Bounds from 'binary-search-bounds';
import { Subject } from 'rxjs';
import { first } from 'rxjs/operators';
import {
    Action,
    Module,
    Mutation,
    VuexModule,
} from 'vuex-module-decorators';

import {
    ArchiveTagAction,
    ClipProgress,
    ClipProgressInit,
    ClipProgressState,
    LastSeenInfo,
    Plugin,
    PluginState,
    RecordingProgressInfo,
    RecordingProgressInit,
    ReorderObservablePluginInfo,
    ReorderPluginInfo,
    SerializedArchiveRecord as ArchiveRecord,
    Snapshot,
    Stream,
    Streamer
} from '@Shared/Types';

function ArchiveRecordCompByNewest(l: ArchiveRecord, r: ArchiveRecord) { return r.timestamp - l.timestamp; }
@Module({ name: 'app' })
export default class App extends VuexModule {
    public connected = false;
    public initialized = false;
    public startTime: number = 0;
    public observables: Stream[] = [];
    public archive: ArchiveRecord[] = [];
    public clipProgress: ClipProgressState[] = [];
    public plugins: Plugin[] = [];
    public activeRecordings: RecordingProgressInfo[] = [];
    public lastTimeArchiveVisit: number = 0;
    private OnInitialized = new Subject<void>();
    @Mutation
    public SOCKET_connect() {
        this.connected = true;
    }
    @Mutation
    public SOCKET_disconnect() {
        this.connected = false;
        this.initialized = false;
    }
    @Mutation
    public SOCKET_Snapshot(snapshot: Snapshot) {
        this.observables = snapshot.observables
            .map(s => ({ ...s, plugins: s.plugins.map(pn => (snapshot.plugins.find(p => p.name === pn)) as Plugin) }));
        this.archive = snapshot.archive;
        this.clipProgress = snapshot.clipProgress;
        this.plugins = snapshot.plugins;
        this.activeRecordings = snapshot.activeRecords;
        this.startTime = snapshot.startTime;

        this.initialized = true;
        this.OnInitialized.next();
    }
    @Mutation
    public SOCKET_AddObservable(stream: Streamer) {
        this.observables
            .push({ ...stream, plugins: stream.plugins.map(pn => (this.plugins.find(p => p.name === pn)) as Plugin) });
    }
    @Mutation
    public SOCKET_RemoveObservable(url: string) {
        const n = this.observables.findIndex(x => x.uri.toLowerCase() === url.toLowerCase());
        n >= 0 && this.observables.splice(n, 1);
    }
    @Mutation
    public SOCKET_UpdateLastSeen(info: LastSeenInfo) {
        const o = this.observables.find(x => x.uri === info.url);
        if (!o) return;
        o.lastSeen = info.lastSeen;
    }
    @Mutation
    public SOCKET_ReorderObservablePlugin([url, oldIndex, newIndex]: ReorderObservablePluginInfo) {
        const observable = this.observables.find(o => o.uri === url) as Stream;
        observable.plugins.splice(newIndex, 0, observable.plugins.splice(oldIndex, 1)[0]);
    }
    @Mutation
    public SOCKET_ReorderPlugin(transition: ReorderPluginInfo) {
        this.plugins.splice(transition[1], 0, this.plugins.splice(transition[0], 1)[0]);
    }
    @Mutation
    public SOCKET_EnablePlugin(state: PluginState) {
        const plugin = this.plugins.find(x => x.id === state[0]);
        plugin && (plugin.enabled = state[1]);
    }
    @Mutation
    public SOCKET_AddActiveRecord(info: RecordingProgressInit) {
        this.activeRecordings.push({ ...info, time: 0, bitrate: 0, size: 0, paused: false });
    }
    @Mutation
    public SOCKET_RecordingProgress(progress: RecordingProgressInfo) {
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
    public SOCKET_RemoveRecording(url: string) {
        const rmIdx = this.activeRecordings.findIndex(x => x.label === url);

        if (rmIdx === -1) {
            return;
        }

        this.activeRecordings.splice(rmIdx, 1);
    }
    @Mutation
    public SOCKET_AddArchiveRecord(record: ArchiveRecord) {
        const clipIdx = this.clipProgress.findIndex(x => x.label === record.filename);

        if (clipIdx !== -1)
            this.clipProgress.splice(clipIdx, 1);

        this.archive.push(record);
    }
    @Mutation
    public SOCKET_RemoveArchiveRecord(filename: string) {
        const rmIdx = this.archive.findIndex(x => x.filename === filename);

        if (rmIdx === -1)
            return;

        this.archive.splice(rmIdx, 1);
    }
    @Mutation
    public SOCKET_AttachTagToArchiveRecord([filename, tag]: ArchiveTagAction) {
        const record = this.archive.find(x => x.filename === filename);

        if (record)
            record.tags.push(tag);
    }
    @Mutation
    public SOCKET_DetachTagFromArchiveRecord([filename, tag]: ArchiveTagAction) {
        const record = this.archive.find(x => x.filename === filename);

        if (!record) return;

        const tid = record.tags.findIndex(x => x === tag);

        if (tid !== -1)
            record.tags.splice(tid, 1);
    }
    @Mutation
    public SOCKET_AddClipProgress(clip: ClipProgressInit) {
        this.clipProgress.push({ ...clip, progress: 0, eta: 0 });
    }
    @Mutation
    public SOCKET_RemoveClipProgress(label: string) {
        const clipIdx = this.clipProgress.findIndex(x => x.label === label);

        if (clipIdx !== -1)
            this.clipProgress.splice(clipIdx, 1);
    }
    @Mutation
    public SOCKET_ClipProgress(clip: ClipProgress) {
        const target = this.clipProgress.find(x => x.label === clip.label);

        if (!target)
            return;

        target.progress = clip.progress;
        target.eta = clip.eta;
    }
    @Mutation
    public SOCKET_LockRecord(label: string) {
        const found = this.archive.find(x => x.filename === label);
        if (!found) return;
        found.locked = true;
    }
    @Mutation
    public SOCKET_UnlockRecord(label: string) {
        const found = this.archive.find(x => x.filename === label);
        if (!found) return;
        found.locked = false;
    }
    @Mutation
    public UpdateLastTimeArchiveVisit() {
        this.lastTimeArchiveVisit = Math.floor(Date.now() / 1000);
    }
    @Action
    public async AwaitInitialization(timeout: number) {
        return this.initialized ? Promise.resolve() :
            new Promise<void>((ret, err) => {
                const tid = setTimeout(() => err(), timeout);
                this.OnInitialized
                    .pipe(first())
                    .subscribe(x => (clearTimeout(tid), ret()));
            });
    }
    public get TotalObservables() {
        return this.observables.length;
    }
    public get RecordsByNewest() {
        return [...this.archive].sort(ArchiveRecordCompByNewest);
    }
    public get NewRecordsCount() {
        const needle = {
            title: '',
            source: '',
            timestamp: this.lastTimeArchiveVisit,
            duration: -1,
            size: -1,
            filename: '',
            tags: [],
            locked: false
        };
        return Bounds.gt(this.RecordsByNewest, needle, ArchiveRecordCompByNewest);
    }
    public get ArchiveTotalRecords() {
        return this.archive.length;
    }
    public get ArchiveTotalDuration() {
        return this.archive.reduce((duration: number, record: ArchiveRecord) => duration + record.duration, 0);
    }
    public get TotalActiveRecordings() {
        return this.activeRecordings.length;
    }

    public get ArchiveSize() {
        return this.archive.reduce((size, x) => size + x.size, 0);
    }

    public get ActiveRecordingsSize() {
        return this.activeRecordings.reduce((size, x) => size + x.size, 0);
    }

    public get NetworkUtilization() {
        const Bitrate = (x: RecordingProgressInfo) => x.paused ? 0 : x.bitrate;
        return this.activeRecordings.reduce((speed: number, ar: RecordingProgressInfo) => speed + Bitrate(ar), 0);
    }
}
