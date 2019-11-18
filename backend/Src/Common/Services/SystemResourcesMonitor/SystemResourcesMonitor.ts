export interface SystemInfo {
    cpu: number;
    rss: number;
    hdd: number;
}

export interface SystemResourcesMonitor {
    readonly Info: SystemInfo;
    Start(): void;
}
