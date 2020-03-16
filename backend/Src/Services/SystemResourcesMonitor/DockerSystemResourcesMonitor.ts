import * as fs from 'fs';
import * as readline from 'readline';

import { SystemInfo } from '@Shared/Types';
import { Broadcaster } from '../../ClientIO/Broadcaster';
import { Logger } from '../../Common/Logger';
import { Exists, GetFolderSize } from '../../Common/Util';
import { SystemResourcesMonitor } from './SystemResourcesMonitor';

class PropertyReader {
    public constructor(private source: string, private prop: string) { }
    public async Read(): Promise<number> {
        return new Promise((ok, fail) => {
            const reader = readline.createInterface({
                input: fs.createReadStream(this.source)
            });

            reader.on('line', (line: string) => {
                if (line.startsWith(this.prop)) {
                    reader.removeAllListeners();
                    ok(parseFloat(line.slice(this.prop.length).trim()));
                }
            });

            reader.once('close', () => fail(new Error(`Propery ${this.prop} not found in ${this.source}`)));
        });
    }
}

interface CpuInfoSnapshot {
    timestamp: number;
    time: number;
}

export class DockerSystemResourcesMonitor implements SystemResourcesMonitor {
    public static async CgroupAvailable() {
        return await Exists(DockerSystemResourcesMonitor.DOCKER_CPU_STAT) &&
            await Exists(DockerSystemResourcesMonitor.DOCKER_MEM_STAT);
    }
    private static readonly DOCKER_CPU_STAT = '/sys/fs/cgroup/cpu,cpuacct/cpuacct.usage';
    private static readonly DOCKER_MEM_STAT = '/sys/fs/cgroup/memory/memory.stat';

    private cpuLoadReader = new PropertyReader(DockerSystemResourcesMonitor.DOCKER_CPU_STAT, '');
    private memoryReader = new PropertyReader(DockerSystemResourcesMonitor.DOCKER_MEM_STAT, 'rss');

    private timer: NodeJS.Timeout | null = null;
    private info: SystemInfo = { cpu: 0, rss: 0, hdd: 0 };
    private cpuInfoPrev: CpuInfoSnapshot = { timestamp: Date.now() - 1, time: 0 };
    constructor(private broadcaster: Broadcaster, private archiveFolder: string, private updatePeriod: number) { }

    public get Info(): SystemInfo {
        return this.info;
    }

    public Start() {
        this.Tick();
    }

    private ScheduleNext() {
        this.timer = setTimeout(() => this.Tick(), this.updatePeriod);
    }

    private async Tick() {
        try {
            this.info.hdd = await GetFolderSize(this.archiveFolder);
        } catch (e) {
            Logger.Get.Log('FIXME: Deleting archive record while GetFolderSize execution.');
        }

        const timestamp = Date.now();
        const time = await this.cpuLoadReader.Read();
        this.info.cpu = Math.round((time - this.cpuInfoPrev.time) / (timestamp - this.cpuInfoPrev.timestamp) / 10000);
        this.cpuInfoPrev = { timestamp, time };

        this.info.rss = await this.memoryReader.Read();

        this.broadcaster.SystemMonitorUpdate(this.info);
        this.ScheduleNext();
    }
}
