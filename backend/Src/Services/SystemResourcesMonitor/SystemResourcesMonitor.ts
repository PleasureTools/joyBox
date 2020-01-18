import { SystemInfo } from '@Shared/Types';

export interface SystemResourcesMonitor {
    readonly Info: SystemInfo;
    Start(): void;
}
