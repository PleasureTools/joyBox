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
    SystemInfo
} from '@Shared/Types';

export class Broadcaster {
    public constructor(private io: socketIo.Server) { }
    // Channel
    public AddObservable(observable: Streamer) {
        this.io.emit('AddObservable', observable);
    }
    public RemoveObservable(url: string) {
        this.io.emit('RemoveObservable', url);
    }
    public ReorderObservablePlugin(stream: ReorderObservablePluginInfo) {
        this.io.emit('ReorderObservablePlugin', stream);
    }
    public UpdateLastSeen<T>(info: Exact<T, LastSeenInfo>) {
        this.io.emit('UpdateLastSeen', info);
    }
    // Plugin
    public EnablePlugin(target: PluginState) {
        this.io.emit('EnablePlugin', target);
    }
    public RedorderPlugin(transition: ReorderPluginInfo) {
        this.io.emit('ReorderPlugin', transition);
    }
    // Recording
    public NewRecording<T>(info: Exact<T, RecordingProgressInit>) {
        this.io.emit('AddActiveRecord', info);
    }
    public RecordingProgress<T>(progress: Exact<T, RecordingProgressUpdate>) {
        this.io.emit('RecordingProgress', progress);
    }
    public RemoveRecording(source: string) {
        this.io.emit('RemoveRecording', source);
    }
    // Archive
    public AddArchiveRecord(record: SerializedArchiveRecord) {
        this.io.emit('AddArchiveRecord', record);
    }
    public RemoveArchiveRecord(filename: string) {
        this.io.emit('RemoveArchiveRecord', filename);
    }
    public LockRecord(filename: string) {
        this.io.emit('LockRecord', filename);
    }
    public UnlockRecord(filename: string) {
        this.io.emit('UnlockRecord', filename);
    }
    public AttachTagToArchiveRecord(filename: string, tag: string) {
        this.io.emit('AttachTagToArchiveRecord', filename, tag);
    }
    public DetachTagFromArchiveRecord(filename: string, tag: string) {
        this.io.emit('DetachTagFromArchiveRecord', filename, tag);
    }
    public AddArchiveFilter<T>(filter: Exact<T, Filter>) {
        this.io.emit('AddArchiveFilter', filter);
    }
    public RemoveArchiveFilter(id: number) {
        this.io.emit('RemoveArchiveFilter', id);
    }
    public AddObservablesFilter<T>(filter: Exact<T, Filter>) {
        this.io.emit('AddObservablesFilter', filter);
    }
    public RemoveObservablesFilter(id: number) {
        this.io.emit('RemoveObservablesFilter', id);
    }
    // Clip
    public NewClipProgress<T>(info: Exact<T, ClipProgressInit>) {
        this.io.emit('AddClipProgress', info);
    }
    public ClipProgress<T>(info: Exact<T, ClipProgress>) {
        this.io.emit('ClipProgress', info);
    }
    public RemoveClipProgress(filename: string) {
        this.io.emit('RemoveClipProgress', filename);
    }
    // System monitor
    public SystemMonitorUpdate<T>(info: Exact<T, SystemInfo>) {
        this.io.emit('SystemMonitorUpdate', info);
    }
    // Non specific
    public UpdateStorageQuota(quota: number) {
        this.io.emit('UpdateStorageQuota', quota);
    }
    public UpdateInstanceQuota(quota: number) {
        this.io.emit('UpdateInstanceQuota', quota);
    }
    public UpdateDownloadSpeedQuota(quota: number) {
        this.io.emit('UpdateDownloadSpeedQuota', quota);
    }
}
