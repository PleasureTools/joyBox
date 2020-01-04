import { LocatorService } from '../Plugins/Plugin';

export type Ref<T> = T | null;
export interface Plugin {
    id: number;
    name: string;
    enabled: boolean;
    service: LocatorService;
}

export interface ArchiveRecord {
    title: string;
    source: string;
    timestamp: number;
    duration: number;
    filename: string;
    locked: boolean;
}

export interface ObservableStream {
    // User-friendly stream url
    url: string;
    lastSeen: number;
    // Plugins that can handle stream, arranged in priority order
    plugins: Plugin[];
}

export type TrackedStreamCollection = Map<string, ObservableStream>;
export interface ClipProgress {
    label: string;
    duration: number;
    progress: number; // 0-100
}
