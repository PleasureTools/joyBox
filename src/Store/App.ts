import {
    Module,
    Mutation,
    VuexModule,
} from 'vuex-module-decorators';

import { ArchiveRecord, Plugin, RecordInfo, Snapshot, SnapshotStream, Stream } from '@/types';

interface LastSeenInfo {
    url: string;
    lastSeen: number;
}
@Module({ name: 'app' })
export default class App extends VuexModule {
    public connected = false;
    public startTime: number = 0;
    public observables: Stream[] = [];
    public archive: ArchiveRecord[] = [];
    public plugins: Plugin[] = [];
    public activeRecordings: RecordInfo[] = [];
    @Mutation
    public SOCKET_connect() {
        this.connected = true;
    }
    @Mutation
    public SOCKET_disconnect() {
        this.connected = false;
    }
    @Mutation
    public SOCKET_snapshot(snapshot: Snapshot) {
        this.observables = snapshot.observables
            .map(s => ({ ...s, plugins: s.plugins.map(pn => (snapshot.plugins.find(p => p.name === pn)) as Plugin) }));
        this.archive = snapshot.archive;
        this.plugins = snapshot.plugins;
        this.activeRecordings = snapshot.activeRecords;
        this.startTime = snapshot.startTime;
    }
    @Mutation
    public SOCKET_AddObservable(stream: SnapshotStream) {
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
    public SOCKET_ReorderObservablePlugin([url, oldIndex, newIndex]: any[]) {
        const observable = this.observables.find(o => o.uri === url) as Stream;
        observable.plugins.splice(newIndex, 0, observable.plugins.splice(oldIndex, 1)[0]);
    }
    @Mutation
    public SOCKET_ReorderPlugin(transition: number[]) {
        this.plugins.splice(transition[1], 0, this.plugins.splice(transition[0], 1)[0]);
    }
    @Mutation
    // plugin = [id, enabled];
    public SOCKET_EnablePlugin(plugin: any[]) {
        (this.plugins.find(x => x.id === plugin[0]) as Plugin).enabled = plugin[1];
    }
    @Mutation
    public SOCKET_AddActiveRecord(url: string) {
        this.activeRecordings.push({ label: url, time: 0, bitrate: 0, size: 0 });
    }
    @Mutation
    public SOCKET_RecordingProgress(progress: RecordInfo) {
        const record = this.activeRecordings.find(r => r.label === progress.label);

        if (record === undefined) {
            return;
        }

        record.bitrate = progress.bitrate;
        record.time = progress.time;
        record.size = progress.size;
    }
    @Mutation
    public SOCKET_RemoveActiveRecord(url: string) {
        const rmIdx = this.activeRecordings.findIndex(x => x.label === url);

        if (rmIdx === -1) {
            return;
        }

        this.activeRecordings.splice(rmIdx, 1);
    }
    @Mutation
    public SOCKET_AddArchiveRecord(record: ArchiveRecord) {
        this.archive.push(record);
    }
    @Mutation
    public SOCKET_RemoveArchiveRecord(filename: string) {
        const rmIdx = this.archive.findIndex(x => x.filename === filename);

        if (rmIdx === -1)
            return;

        this.archive.splice(rmIdx, 1);
    }
    public get TotalObservables() {
        return this.observables.length;
    }
    public get RecordsByNewest() {
        return [...this.archive].sort((a: ArchiveRecord, b: ArchiveRecord) => b.timestamp - a.timestamp);
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
    public get NetworkUtilization() {
        return this.activeRecordings.reduce((speed: number, ar: RecordInfo) => speed + ar.bitrate, 0);
    }
}
