import { ArchiveRecord } from '@Shared/Types';
import { Broadcaster } from './ClientIO/Broadcaster';
import { ObservableStream } from './Common/Types';
import { NotificationCenter } from './Services/NotificationCenter';
import { PluginManager } from './Services/PluginManager';
import { RecordingService } from './Services/RecordingService';
import { SqliteAdapter } from './Services/SqliteAdapter';
import { StreamDispatcher } from './StreamDispatcher';

export class AppFacade {
    public constructor(
        private storage: SqliteAdapter,
        private broadcaster: Broadcaster,
        private observables: Map<string, ObservableStream>,
        private archive: ArchiveRecord[],
        private pluginManager: PluginManager,
        private linkedStreams: StreamDispatcher,
        private recorder: RecordingService,
        private notificationCenter: NotificationCenter) { }
    public get Storage() {
        return this.storage;
    }
    public get Broadcaster() {
        return this.broadcaster;
    }
    public get Archive() {
        return this.archive;
    }
    public get PluginManager() {
        return this.pluginManager;
    }
    public get LinkedStreams() {
        return this.linkedStreams;
    }
    public get Recorder() {
        return this.recorder;
    }
    public get NotificationCenter() {
        return this.notificationCenter;
    }
    public get Observables() {
        return this.observables;
    }
}
