import * as socketIo from 'socket.io';

import { Broadcaster } from './Broadcaster';
import { SystemResourcesMonitor } from './Services/SystemResourcesMonitor';
import { DevSystemResourcesMonitor } from './Services/SystemResourcesMonitor/DevSystemResourcesMonitor';
import { DockerSystemResourcesMonitor } from './Services/SystemResourcesMonitor/DockerSystemResourcesMonitor';

export class SystemResourcesMonitorFactory {
    private readonly DOCKER_PLATFORM = 'DOCKER';

    public constructor(private brcst: Broadcaster, private archiveFolder: string, private updatePeriod: number) { }

    public Create(): SystemResourcesMonitor {
        switch (process.env.PLATFORM) {
            case this.DOCKER_PLATFORM:
                return new DockerSystemResourcesMonitor(this.brcst, this.archiveFolder, this.updatePeriod);
            default:
                return new DevSystemResourcesMonitor(this.brcst, this.archiveFolder, this.updatePeriod);

        }
    }
}
