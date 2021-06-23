export type Exact<T, D> = T extends D ?
    Exclude<keyof T, keyof D> extends never ?
    T : never : never;

export interface Plugin {
    id: number;
    name: string;
    enabled: boolean;
}

export type PluginState = [number, boolean];
export type ReorderPluginInfo = [number, number];
export type ReorderObservablePluginInfo = [string, number, number];
export type ArchiveTagAction = [string, string];

export interface Stream {
    uri: string;
    lastSeen: number;
    plugins: Plugin[];
}

export interface RecordingProgressId {
    label: string;
}

export interface RecordingProgressInit extends RecordingProgressId {
    streamUrl: string;
}

export interface RecordingProgressUpdate extends RecordingProgressId {
    time: number;
    bitrate: number;
    size: number;
    paused: boolean;
}

export interface RecordingProgressInfo extends RecordingProgressUpdate, RecordingProgressInit { }

export interface Streamer {
    uri: string;
    lastSeen: number;
    plugins: string[];
}

export interface ArchiveRecord {
    title: string;
    source: string;
    timestamp: number;
    duration: number;
    size: number;
    filename: string;
    locked: boolean;
    tags: Set<string>;
}

export type SerializedArchiveRecord = Omit<ArchiveRecord, 'tags'> & { tags: string[] };

export type SerializedFileRecord = Omit<FileRecord, 'tags'> & { tags: string[] };

export interface SystemMonitorInfo {
    cpu: number;
    rss: number;
    hdd: number;
}

export interface AppStateSnapshot {
    observables: Streamer[];
    plugins: Plugin[];
    archiveFilters: Filter[];
    observablesFilters: Filter[];
    archive: SerializedArchiveRecord[];
    clipProgress: ClipProgressState[];
    activeRecords: RecordingProgressInfo[];
    systemResources: SystemMonitorInfo;
    startTime: number;
    defaultAccess: AppAccessType;
    storageQuota: number;
    instanceQuota: number;
    downloadSpeedQuota: number;
}

export interface FileRecord extends ArchiveRecord {
    thumbnail: string;
}

export interface ClipProgressInit {
    label: string;
    duration: number; // seconds
}

export interface ClipProgress {
    label: string;
    progress: number;
    eta: number;
}

export type ClipProgressState = ClipProgressInit & ClipProgress;

export interface LastSeenInfo {
    url: string;
    lastSeen: number;
}

export interface SystemInfo {
    cpu: number;
    rss: number;
    hdd: number;
}

export interface LogItem {
    timestamp: number;
    message: string;
}

export enum AppAccessType { NO_ACCESS, VIEW_ACCESS, FULL_ACCESS }

export interface Filter {
    id: number;
    name: string;
    query: string;
}
