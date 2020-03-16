import * as Sqlite3 from 'better-sqlite3';
import * as history from 'connect-history-api-fallback';
import Express = require('express');
import * as fs from 'fs';
import { Server as HTTPServer } from 'http';
import { Server as HTTPSServer } from 'https';
import * as SocketIo from 'socket.io';

import { PluginManager } from './Services/PluginManager';
import { SqliteAdapter } from './Services/SqliteAdapter';
import { SystemResourcesMonitor, SystemResourcesMonitorFactory } from './Services/SystemResourcesMonitor';
import { StreamDispatcher } from './StreamDispatcher';

import { ArchiveRecord, ClipProgress, ObservableStream, Plugin } from './Common/Types';
import { BongacamsDirectLocator, BongacamsExtractor, BongacamsLocator } from './Plugins/Bongacams';
import { CamsodaExtractor, CamsodaLocator } from './Plugins/Camsoda';
import { ChaturbateDirectLocator, ChaturbateExtractor } from './Plugins/Chaturbate';
import { DummyExtractor, DummyLocator } from './Plugins/Dummy';
import { LocatorService } from './Plugins/Plugin';
import { NotificationCenter } from './Services/NotificationCenter';
import { RecordingService } from './Services/RecordingService';

import { AppAccessType } from '@Shared/Types';
import { AccessGuard } from './AccessGuard';
import { Config as C } from './BootstrapConfiguration';
import { Broadcaster, RpcRequestHandlerImpl } from './ClientIO';
import { LinkCounter } from './Common/LinkCounter';
import { ConsoleWriter, Logger, SqliteWriter } from './Common/Logger';
import { ARCHIVE_FOLDER, DATA_FOLDER, DB_LOCATION, THUMBNAIL_FOLDER } from './Constants';
import { WebServerFactory } from './WebServerFactory';

import { AppFacade } from './AppFacade';
import { PluginManagerListener } from './PluginManagerListener';
import { RecorderListener } from './RecorderListener';

class App {
    // Low level blocks region
    private express: Express.Application;
    private server: HTTPServer | HTTPSServer;
    private io: SocketIo.Server;
    private db!: Sqlite3.Database;
    private storage!: SqliteAdapter;
    private broadcaster: Broadcaster;
    // State region
    private observables: Map<string, ObservableStream> = new Map();
    private archive!: ArchiveRecord[];
    private archiveRefCounter = new LinkCounter<string>();
    private clipProgress: Map<string, ClipProgress> = new Map();
    // Modules region
    private pluginManager: PluginManager = new PluginManager();
    private linkedStreams: StreamDispatcher = new StreamDispatcher(this.observables);
    private recorder: RecordingService = new RecordingService();
    private systemResourcesMonitor!: SystemResourcesMonitor;
    private notificationCenter!: NotificationCenter;
    // Util region
    private facade!: AppFacade;
    private recorderListener!: RecorderListener;
    private pluginManagerListener!: PluginManagerListener;
    private readonly ARCHIVE_MOUNT_POINT = '/archive';
    constructor() {
        Logger.Get.AddWriter(new ConsoleWriter());
        this.express = Express();
        this.server = new WebServerFactory().Create();
        this.server.on('request', this.express);
        this.io = SocketIo(this.server);
        this.broadcaster = new Broadcaster(this.io);

        if (C.DefaultAccess === AppAccessType.NO_ACCESS) {
            const mediaAccessGuard = new AccessGuard(C.JwtSecret);
            this.express.use(`${this.ARCHIVE_MOUNT_POINT}/*.mp4`, mediaAccessGuard.Middleware);
        }
        this.express.use(this.ARCHIVE_MOUNT_POINT, Express.static('data/archive', { maxAge: 600000 }));

        const staticFrontend = Express.static('client/');
        // For really existing resources, just return them
        this.express.use(staticFrontend);
        // Anything else process via SPA
        this.express.use(history({
            index: '/index.html',
            disableDotRule: true
        }));
        this.express.use(staticFrontend);

        this.RegisterPlugin('bongacams', new BongacamsLocator(new BongacamsExtractor()));
        this.RegisterPlugin('bongacams_direct', new BongacamsDirectLocator(new BongacamsExtractor()));
        this.RegisterPlugin('chaturbate', new ChaturbateDirectLocator(new ChaturbateExtractor()));
        this.RegisterPlugin('camsoda', new CamsodaLocator(new CamsodaExtractor()));
        this.RegisterPlugin('dummy', new DummyLocator(new DummyExtractor()));

        this.StartResourceMonitor();
    }

    public RegisterPlugin(name: string, service: LocatorService) {
        this.pluginManager.Register(name, service);
    }

    public Run(): void {
        if (!this.IsDataMounted()) {
            Logger.Get.Log('\'/app/data\' folder doesn\'t exist. Maybe forgot to mount it');
            process.exit(1);
        }

        this.db = new Sqlite3(DB_LOCATION);
        this.storage = new SqliteAdapter(this.db);

        if (!this.storage.IsInitialized()) {
            Logger.Get.Log('Database doesn\'t initialized or malformed. Initialization...');
            this.InitializeDb();
        }

        Logger.Get.AddWriter(new SqliteWriter(this.storage));

        try {
            this.PrepareFileSystem();
        } catch (e) {
            Logger.Get.Log(`Preparing filesystem error. ${e}`);
            process.exit(1);
        }

        this.notificationCenter = new NotificationCenter(this.storage);

        this.LoadData();

        process.on('SIGTERM', () => this.Shutdown());

        this.io.on('connection', socket => {
            Logger.Get.Log(`[${socket.id}][${socket.request.connection.remoteAddress}] client connected`);
            new RpcRequestHandlerImpl(
                socket,
                this.broadcaster,
                this.observables,
                this.pluginManager,
                this.storage,
                this.linkedStreams,
                this.archive,
                this.archiveRefCounter,
                this.clipProgress,
                this.recorder,
                this.systemResourcesMonitor,
                this.notificationCenter,
                () => this.Shutdown());

            socket.on('disconnect', () => {
                Logger.Get.Log(`[${socket.id}] client disconnected`);
            });
        });
        this.linkedStreams.Initialize();
        this.pluginManager.Start();

        this.facade = new AppFacade(
            this.storage,
            this.broadcaster,
            this.observables,
            this.archive,
            this.pluginManager,
            this.linkedStreams,
            this.recorder,
            this.notificationCenter);

        this.recorderListener = new RecorderListener(this.facade);
        this.pluginManagerListener = new PluginManagerListener(this.facade);
        this.server.listen(C.Port);
    }

    public IsDataMounted(): boolean {
        return fs.existsSync(DATA_FOLDER);
    }

    public InitializeDb(): void {
        this.storage.Initialize(this.pluginManager.Plugins.map(x => x.name));
    }

    /**
     * Prepares the file system if necessary.
     * ├── data/
     *     ├── archive/
     *          ├── thumbnail/
     */
    public PrepareFileSystem() {
        if (!fs.existsSync(ARCHIVE_FOLDER)) {
            fs.mkdirSync(ARCHIVE_FOLDER);
            fs.mkdirSync(THUMBNAIL_FOLDER);
        } else if (!fs.existsSync(THUMBNAIL_FOLDER)) {
            fs.mkdirSync(THUMBNAIL_FOLDER);
        }
    }

    public LoadData(): void {
        const pluginState = this.storage.FetchPlugins();

        pluginState.forEach(x => {
            const p = this.pluginManager.FindPlugin(x.name);

            if (p === null) {
                return;
            }

            p.id = x.id;
            p.enabled = x.enabled;

            const observables = new Set<string>();
            p.service.SetObservables(observables);
            this.linkedStreams.AddPlugin(p.id, observables);
        });
        this.pluginManager.ReorderPlugins(pluginState.map(x => x.id));

        this.storage
            .FetchObservables()
            .forEach(x => {
                const plugins: Plugin[] = [];
                for (const name of x.plugins) {
                    const plugin = this.pluginManager.FindPlugin(name);

                    if (plugin === null) {
                        Logger.Get.Log(`${x.url} has missing plugin '${name}'`);
                        return;
                    }
                    plugins.push(plugin);
                }

                this.observables.set(x.url, { url: x.url, lastSeen: x.lastSeen, plugins });
            });

        this.archive = this.storage.FetchArchiveRecords()
            .map(x => ({ ...x, locked: false }));
    }
    private async StartResourceMonitor() {
        this.systemResourcesMonitor =
            await new SystemResourcesMonitorFactory(this.broadcaster, ARCHIVE_FOLDER, 10000).Create();
        this.systemResourcesMonitor.Start();
    }

    private async Shutdown() {
        Logger.Get.Log('Shutting down. Waiting for recorder stops.');
        const Wait = () => {
            return new Promise((resolve) => {
                let awaitedRecordings = this.recorder.Records.length;
                if (!awaitedRecordings) {
                    resolve();
                    return;
                }
                this.pluginManager.Stop();
                this.recorder.Records
                    .map(r => r.label)
                    .forEach(l => this.recorder.StopRecording(l));
                this.recorderListener.CompleteEvent.On(() => {
                    if (--awaitedRecordings === 0)
                        resolve();
                });

            });
        };
        await Wait();
        Logger.Get.Log('Exit');
        process.exit(0);
    }
}

const app = new App();
app.Run();
