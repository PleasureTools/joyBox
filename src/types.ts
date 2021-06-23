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

export interface SnapshotStream {
    uri: string;
    lastSeen: number;
    plugins: string[];
}
export interface SystemMonitorInfo {
    cpu: number;
    rss: number;
    hdd: number;
}
export interface InputEventSubject<M, D = any> {
    event: { name: string, msg: M };
    data: D;
}

export interface TouchWrapper {
    touchstartX: number;
    touchstartY: number;
    touchmoveX: number;
    touchmoveY: number;
    touchendX: number;
    touchendY: number;
    offsetX: number;
    offsetY: number;
}

export interface UntrackedVideo {
    filename: string;
    size: number;
}
