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

export interface Stream {
    uri: string;
    lastSeen: number;
    plugins: Plugin[];
}

export interface RecordingProgressInfo {
    label: string;
    time: number;
    bitrate: number;
    size: number;
    paused: boolean;
}

export interface Streamer {
    uri: string;
    lastSeen: number;
    plugins: string[];
}

export interface ArchiveRecord {
    title: string;
    source: string;
    timestamp: number;
    duration: number; // seconds
    size: number;
    filename: string;
    locked: boolean;
}

export interface SystemMonitorInfo {
    cpu: number;
    rss: number;
    hdd: number;
}
export interface Snapshot {
    observables: Streamer[];
    plugins: Plugin[];
    archive: ArchiveRecord[];
    clipProgress: ClipProgressState[];
    activeRecords: RecordingProgressInfo[];
    systemResources: SystemMonitorInfo;
    startTime: number;
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
