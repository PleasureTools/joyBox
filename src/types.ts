export interface Plugin {
    id: number;
    name: string;
    enabled: boolean;
}

export interface Stream {
    uri: string;
    lastSeen: number;
    plugins: Plugin[];
}

export interface RecordInfo {
    label: string;
    time: number;
    bitrate: number;
    size: number;
}

export interface SnapshotStream {
    uri: string;
    lastSeen: number;
    plugins: string[];
}

export interface ArchiveRecord {
    title: string;
    source: string;
    timestamp: number;
    duration: number; // seconds
    filename: string;
}

export interface SystemMonitorInfo {
    cpu: number;
    rss: number;
    hdd: number;
}
export interface Snapshot {
    observables: SnapshotStream[];
    plugins: Plugin[];
    archiveSize: number;
    archive: ArchiveRecord[];
    activeRecords: RecordInfo[];
    systemResources: SystemMonitorInfo;
    startTime: number;
}

export interface FileRecord extends ArchiveRecord {
    thumbnail: string;
}
