import { Broadcaster } from '../../ClientIO';
import { DefaultSystemResourceMonitor } from './DefaultSystemResourceMonitor';
import { DockerSystemResourcesMonitor } from './DockerSystemResourcesMonitor';
import { SystemResourcesMonitor } from './SystemResourcesMonitor';

export class SystemResourcesMonitorFactory {
    private readonly DOCKER_PLATFORM = 'DOCKER';

    public constructor(private brcst: Broadcaster, private archiveFolder: string, private updatePeriod: number) { }

    public async Create(): Promise<SystemResourcesMonitor> {

        return process.env.PLATFORM === this.DOCKER_PLATFORM && await DockerSystemResourcesMonitor.CgroupAvailable() ?
            new DockerSystemResourcesMonitor(this.brcst, this.archiveFolder, this.updatePeriod) :
            new DefaultSystemResourceMonitor(this.brcst, this.archiveFolder, this.updatePeriod);
    }
}
