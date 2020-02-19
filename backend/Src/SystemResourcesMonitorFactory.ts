import { Broadcaster } from './Broadcaster';
import { SystemResourcesMonitor } from './Services/SystemResourcesMonitor';
import { DefaultSystemResourceMonitor } from './Services/SystemResourcesMonitor/DefaultSystemResourceMonitor';
import { DockerSystemResourcesMonitor } from './Services/SystemResourcesMonitor/DockerSystemResourcesMonitor';

export class SystemResourcesMonitorFactory {
    private readonly DOCKER_PLATFORM = 'DOCKER';

    public constructor(private brcst: Broadcaster, private archiveFolder: string, private updatePeriod: number) { }

    public async Create(): Promise<SystemResourcesMonitor> {

        return process.env.PLATFORM === this.DOCKER_PLATFORM && await DockerSystemResourcesMonitor.CgroupAvailable() ?
            new DockerSystemResourcesMonitor(this.brcst, this.archiveFolder, this.updatePeriod) :
            new DefaultSystemResourceMonitor(this.brcst, this.archiveFolder, this.updatePeriod);
    }
}
