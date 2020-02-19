import * as sqlite3 from 'better-sqlite3';
import * as history from 'connect-history-api-fallback';
import Express = require('express');
import * as fs from 'fs';
import { Server as HTTPServer } from 'http';
import { Server as HTTPSServer } from 'https';
import { basename, join, parse } from 'path';
import prettyMs = require('pretty-ms');
import * as socketIo from 'socket.io';

import { PluginManager } from './Services/PluginManager';
import { SqliteAdapter } from './Services/SqliteAdapter';

import { BongacamsDirectLocator, BongacamsExtractor, BongacamsLocator } from './Plugins/Bongacams';
import { ChaturbateDirectLocator, ChaturbateExtractor } from './Plugins/Chaturbate';

import { DummyExtractor, DummyLocator } from './Plugins/Dummy';

import { FileSize, GenFilename, Timestamp, UsernameFromUrl } from './Common/Util';

import { ArchiveRecord, ClipProgress, ObservableStream, Plugin } from './Common/Types';
import { LocatorService } from './Plugins/Plugin';

import { StreamDispatcher } from './Common/StreamDispatcher';

import { FileNotFoundException, StreamRecordInfo } from './Common/StreamRecordInfo';
import { CompleteInfo, RecordingService } from './Services/RecordingService';

import { ThumbnailGenerator } from './Common/ThumbnailGenerator';
import { SystemResourcesMonitor } from './Services/SystemResourcesMonitor';

import { ArchiveUsage } from './Common/ArchiveUsage';
import { Event } from './Common/Event';
import { RpcRequestHandlerImpl } from './RpcRequestHandler';
import { SystemResourcesMonitorFactory } from './SystemResourcesMonitorFactory';

import { WebServerFactory } from './WebServerFactory';

import { Config as C } from './BootstrapConfiguration';
import { NotificationCenter } from './Services/NotificationCenter';

import { AppAccessType } from '@Shared/Types';
import { AccessGuard } from './AccessGuard';
import { Broadcaster } from './Broadcaster';
import { ConsoleWriter, Logger, SqliteWriter } from './Common/Logger';
import { ARCHIVE_FOLDER, DATA_FOLDER, DB_LOCATION, THUMBNAIL_FOLDER } from './Constants';

class App {
    // Low level blocks region
    private express: any;
    private server: HTTPServer | HTTPSServer;
    private io: socketIo.Server;
    private db!: sqlite3.Database;
    private storage!: SqliteAdapter;
    private broadcaster!: Broadcaster;

    // State region
    private observables: Map<string, ObservableStream> = new Map();
    private archive!: ArchiveRecord[];
    private archiveUsage = new ArchiveUsage();
    private clipProgress: Map<string, ClipProgress> = new Map();

    // Modules region
    private pluginManager: PluginManager = new PluginManager();

    private linkedStreams: StreamDispatcher = new StreamDispatcher(this.observables);
    private recorder: RecordingService = new RecordingService();

    private systemResourcesMonitor: SystemResourcesMonitor;

    private notificationCenter!: NotificationCenter;

    // Util region
    private fileInfo: StreamRecordInfo = new StreamRecordInfo();

    // Trash region
    private readyRecordTunnel = new Event<void>();

    private readonly ARCHIVE_MOUNT_POINT = '/archive';
    constructor() {
        Logger.Get.AddWriter(new ConsoleWriter());
        this.express = Express();
        this.server = new WebServerFactory().Create();
        this.server.on('request', this.express);
        this.io = socketIo(this.server);
        this.broadcaster = new Broadcaster(this.io);

        if (C.DefaultAccess === AppAccessType.NO_ACCESS) {
            const mediaAccessGuard = new AccessGuard();
            mediaAccessGuard.SetPassphrase(C.AccessPassphrase);
            this.express.use(`${this.ARCHIVE_MOUNT_POINT}/*.mp4`, mediaAccessGuard.Middleware);
        }
        this.express.use(this.ARCHIVE_MOUNT_POINT, Express.static('data/archive', { maxAge: 600000 }));

        const staticFrontend = Express.static('client/');

        this.express.use(staticFrontend);
        this.express.use(history({
            index: '/index.html',
            disableDotRule: true
        }));
        this.express.use(staticFrontend);

        this.systemResourcesMonitor =
            new SystemResourcesMonitorFactory(this.broadcaster, ARCHIVE_FOLDER, 10000).Create();

        this.RegisterPlugin('bongacams', new BongacamsLocator(new BongacamsExtractor()));
        this.RegisterPlugin('bongacams_direct', new BongacamsDirectLocator(new BongacamsExtractor()));
        this.RegisterPlugin('chaturbate', new ChaturbateDirectLocator(new ChaturbateExtractor()));
        this.RegisterPlugin('dummy', new DummyLocator(new DummyExtractor()));

        this.systemResourcesMonitor.Start();
    }

    public RegisterPlugin(name: string, service: LocatorService) {
        this.pluginManager.Register(name, service);
    }

    public Run(): void {
        if (!this.IsDataMounted()) {
            Logger.Get.Log('\'/app/data\' folder doesn\'t exist. Maybe forgot to mount it');
            process.exit(1);
            return;
        }

        this.db = new sqlite3(DB_LOCATION);
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
                this.archiveUsage,
                this.clipProgress,
                this.recorder,
                this.systemResourcesMonitor,
                this.notificationCenter,
                () => this.Shutdown());

            socket.on('disconnect', () => {
                Logger.Get.Log(`[${socket.id}] client disconnected`);
            });
        });

        this.pluginManager.LiveStreamEvent.On(e => {
            this.recorder.StartRecording(e.url, e.streamUrl, join(ARCHIVE_FOLDER, GenFilename(e.url)));
            this.linkedStreams.Remove(e.url);
            this.UpdateLastSeen(e.url);
            this.broadcaster.NewRecording(e.url);
        });

        this.recorder.ProgressEvent.On(e => {
            this.broadcaster.RecordingProgress({
                label: e.label,
                time: e.time,
                bitrate: e.bitrate,
                size: e.size,
                paused: e.paused,
            });
        });

        // есть готовая запись
        this.recorder.CompleteEvent.On(async (info: CompleteInfo) => {
            // return stream back in watchlist
            this.linkedStreams.Add(info.label);
            this.UpdateLastSeen(info.label);
            // add record to archive
            try {
                const fileInfo = await this.fileInfo.Info(info.filename);
                const newArchiveRecord: ArchiveRecord = {
                    title: info.label,
                    source: info.label,
                    timestamp: Timestamp(),
                    duration: Math.round(parseFloat(fileInfo.duration)),
                    size: await FileSize(info.filename),
                    filename: basename(info.filename),
                    locked: false
                };
                this.archive.push(newArchiveRecord);

                this.storage.AddArchiveRecord(newArchiveRecord);

                const sourceName = parse(info.filename).name;

                await new ThumbnailGenerator()
                    .Generate(info.filename,
                        newArchiveRecord.duration / 10, // 10% from the start
                        join(THUMBNAIL_FOLDER, sourceName));

                this.broadcaster.AddArchiveRecord(newArchiveRecord);
                Logger.Get.Log(`New archive record ${basename(info.filename)}`);
                this.notificationCenter.NotifyAll({
                    title: UsernameFromUrl(info.label),
                    body: prettyMs(newArchiveRecord.duration * 1000),
                    image: `/archive/thumbnail/${sourceName}.jpg`,
                    data: { url: `/player/${sourceName}.mp4` }
                });
            } catch (e) {
                // Ignore StreamRecordInfo file not found exception
                if (!(e instanceof FileNotFoundException))
                    Logger.Get.Log(e);
            }

            // notify clients
            this.broadcaster.RemoveRecording(info.label);
            this.readyRecordTunnel.Emit();
        });

        this.linkedStreams.Initialize();
        this.pluginManager.Start();
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
        const plugins = this.storage.FetchPlugins();

        plugins.forEach(x => {
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
        this.pluginManager.ReorderPlugins(plugins.map(x => x.id));

        this.storage
            .FetchObservables()
            .forEach(x => {
                const plugins: Plugin[] = [];
                for (const name of x.plugins) {
                    const plugin = this.pluginManager.FindPlugin(name);

                    if (plugin === null) {
                        Logger.Get.Log(`Missing plugin '${name}'`);
                        return;
                    }
                    plugins.push(plugin);
                }

                this.observables.set(x.url, { url: x.url, lastSeen: x.lastSeen, plugins });
            });

        this.archive = this.storage.FetchArchiveRecords()
            .map(x => ({ ...x, locked: false }));
    }
    private UpdateLastSeen(url: string) {
        const now = Timestamp();
        const target = this.observables.get(url);
        if (!target) return;
        target.lastSeen = now;
        this.storage.UpdateLastSeen(url, now);
        this.broadcaster.UpdateLastSeen({ url, lastSeen: now });
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
                this.readyRecordTunnel.On(() => {
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
