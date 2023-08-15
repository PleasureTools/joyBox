import * as Sqlite3 from 'better-sqlite3';
import Express = require('express');
import * as fs from 'fs';
import { Server as HTTPServer } from 'http';
import { Server as HTTPSServer } from 'https';
import * as SocketIo from 'socket.io';

import { PluginManager } from './Services/PluginManager';
import { SqliteAdapter } from './Services/SqliteAdapter';
import { SystemResourcesMonitor, SystemResourcesMonitorFactory } from './Services/SystemResourcesMonitor';
import { StreamDispatcher } from './StreamDispatcher';

import { ObservableStream, Plugin } from './Common/Types';
import { BongacamsDirectLocator, BongacamsExtractor, BongacamsLocator } from './Plugins/Bongacams';
import { CamsodaExtractor, CamsodaLocator } from './Plugins/Camsoda';
import { ChaturbateDirectLocator, ChaturbateExtractor } from './Plugins/Chaturbate';
import { KickClipLocator, KickClipExtractor } from './Plugins/KickClip';
import { DummyExtractor, DummyLocator } from './Plugins/Dummy';
import { LocatorService } from './Plugins/Plugin';
import { NotificationCenter } from './Services/NotificationCenter';
import { RecordingService } from './Services/RecordingService';

import { DOWNLOAD_SPEED_QUOTA, INSTANCE_QUOTA_ID, STORAGE_QUOTA_ID } from './Services/PluginManager/Quotas/Constants';
import { Filter, ArchiveRecord, ClipProgressState, Playlist } from '@Shared/Types';
import { Config as C } from './BootstrapConfiguration';
import { Broadcaster, RpcRequestHandlerImpl } from './ClientIO';
import { LinkCounter } from './Common/LinkCounter';
import { ConsoleWriter, Logger, SqliteWriter } from './Common/Logger';
import { ARCHIVE_FOLDER, DATA_FOLDER, DB_LOCATION, INCOMPLETE_FOLDER, THUMBNAIL_FOLDER } from './Constants';
import { WebServerFactory } from './WebServerFactory';

import { AppFacade } from './AppFacade';
import { PluginManagerListener } from './PluginManagerListener';
import { RecorderListener } from './RecorderListener';
import { PluginManagerController } from './Services/PluginManager/PluginManagerController';
import { Settings } from './Settings';
import { SocketSameOrigin } from './SocketSameOrigin';
import { SizeQuotaNotifier } from './Services/SizeQuotaNotifier';

import { DownloadSpeedQuota } from './Services/PluginManager/Quotas/DownloadSpeedQuota';
import { InstanceQuota } from './Services/PluginManager/Quotas/InstanceQuota';
import { StorageQuota } from './Services/PluginManager/Quotas/StorageQuota';

import { ObservableValidatorService } from './Services/ObservableValidator/';
import { ExtractorWithCache } from './Plugins/ExtractorWithCache';

import { HttpRequestHandler } from './Route/HttpRequestHandler';

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
  private playlists!: Playlist[];
  private archiveRefCounter = new LinkCounter<string>();
  private clipProgress: Map<string, ClipProgressState> = new Map();
  private archiveFilters: Map<number, Filter> = new Map();
  private observablesFilters: Map<number, Filter> = new Map();
  private settings!: Settings;
  // Modules region
  private pluginManager: PluginManager = new PluginManager();
  private pluginManagerController = new PluginManagerController(this.pluginManager);
  private linkedStreams: StreamDispatcher = new StreamDispatcher(this.observables);
  private recorder: RecordingService = new RecordingService();
  private systemResourcesMonitor!: SystemResourcesMonitor;
  private notificationCenter!: NotificationCenter;
  private httpRequestHandler!: HttpRequestHandler;
  private sizeQuotaNotifier = new SizeQuotaNotifier(this.recorder);
  private observableValidator!: ObservableValidatorService;
  private playlistExtractor!: ExtractorWithCache;
  // Util region
  private facade!: AppFacade;
  private recorderListener!: RecorderListener;
  private pluginManagerListener!: PluginManagerListener;
  constructor() {
    process.on('uncaughtException', e => Logger.Get.Log(e.toString()));

    Logger.Get.AddWriter(new ConsoleWriter());
    this.express = Express();
    this.server = new WebServerFactory().Create();
    this.server.on('request', this.express);
    this.io = SocketIo(this.server);

    if (C.Hostname !== '') { this.io.origins(SocketSameOrigin); }

    this.broadcaster = new Broadcaster(this.io);

    const bongacamsExtractor = new ExtractorWithCache(new BongacamsExtractor());
    const chaturbateExtractor = new ExtractorWithCache(new ChaturbateExtractor());
    const camsodaExtractor = new ExtractorWithCache(new CamsodaExtractor());
    const kickClipExtractor = new ExtractorWithCache(new KickClipExtractor());

    bongacamsExtractor
      .Next(chaturbateExtractor)
      .Next(camsodaExtractor)
      .Next(kickClipExtractor);

    this.playlistExtractor = bongacamsExtractor;

    this.RegisterPlugin('bongacams', new BongacamsLocator(bongacamsExtractor, 10000));
    this.RegisterPlugin('bongacams_direct', new BongacamsDirectLocator(bongacamsExtractor, 10000));
    this.RegisterPlugin('chaturbate', new ChaturbateDirectLocator(chaturbateExtractor, 10000));
    this.RegisterPlugin('camsoda', new CamsodaLocator(camsodaExtractor, 10000));
    this.RegisterPlugin('kick_clip', new KickClipLocator(kickClipExtractor, 10000, () => this.settings.RemoteSeleniumUrl));
    this.RegisterPlugin('dummy', new DummyLocator(new DummyExtractor(), 10000));

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

    this.settings = new Settings(this.storage);

    Logger.Get.AddWriter(new SqliteWriter(this.storage));

    try {
      this.PrepareFileSystem();
    } catch (e) {
      Logger.Get.Log(`Preparing filesystem error. ${e}`);
      process.exit(1);
    }

    this.notificationCenter = new NotificationCenter(this.storage);
    this.sizeQuotaNotifier.NotificationCenter = this.notificationCenter;

    this.LoadData();

    process.on('SIGTERM', () => {
      Logger.Get.Log('SIGTERM received');
      this.Shutdown();
    });

    this.io.on('connection', socket => {
      Logger.Get.Log(`[${socket.id}][${socket.request.connection.remoteAddress}] client connected`);
      // eslint-disable-next-line no-new
      new RpcRequestHandlerImpl(
        socket,
        this.broadcaster,
        this.observables,
        this.pluginManager,
        this.pluginManagerController,
        this.pluginManagerListener,
        this.storage,
        this.linkedStreams,
        this.archive,
        this.archiveRefCounter,
        this.clipProgress,
        this.archiveFilters,
        this.observablesFilters,
        this.recorder,
        this.systemResourcesMonitor,
        this.notificationCenter,
        this.settings,
        this.facade,
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
      this.playlists,
      this.pluginManager,
      this.linkedStreams,
      this.recorder,
      this.notificationCenter,
      this.sizeQuotaNotifier,
      this.playlistExtractor);

    this.httpRequestHandler = new HttpRequestHandler(this.facade, this.express);
    this.recorderListener = new RecorderListener(this.facade);
    this.pluginManagerListener = new PluginManagerListener(this.facade);
    this.server.listen(C.Port);

    this.observableValidator = new ObservableValidatorService(10 * 60 * 1000, this.facade);
    this.observableValidator.Start();
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
     *     ├── incomplete/
     *     ├── archive/
     *          ├── thumbnail/
     */
  public PrepareFileSystem() {
    if (!fs.existsSync(INCOMPLETE_FOLDER)) {
      fs.mkdirSync(INCOMPLETE_FOLDER);
    }

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

        this.observables.set(x.url, { url: x.url, lastSeen: x.lastSeen, download: x.download, valid: x.valid, plugins });
      });

    this.archive = this.storage.FetchArchiveRecords();
    this.playlists = this.storage.FetchPlaylists();

    this.storage.FetchArchiveTags()
      .forEach(x => this.archive.find(y => y.filename === x.filename)?.tags.add(x.tag));

    this.storage.FetchArchiveFilters()
      .forEach(x => this.archiveFilters.set(x.id, x));

    this.storage.FetchObservablesFilters()
      .forEach(x => this.observablesFilters.set(x.id, x));
  }

  private async StartResourceMonitor() {
    this.systemResourcesMonitor =
            await new SystemResourcesMonitorFactory(ARCHIVE_FOLDER, 10000).Create();
    this.systemResourcesMonitor.OnUpdate.On(x => this.broadcaster.SystemMonitorUpdate(x));

    this.SetupPluginManagerController();

    this.systemResourcesMonitor.Start();
  }

  private SetupPluginManagerController() {
    const settings = this.storage.FetchSettings();
    if (settings.storageQuota > 0) {
      const arbiter = new StorageQuota(this.recorder, this.systemResourcesMonitor);
      arbiter.Quota = settings.storageQuota;

      this.pluginManagerController.AddArbiter(arbiter, STORAGE_QUOTA_ID);

      this.sizeQuotaNotifier.UpdateQuota(settings.storageQuota);
      this.sizeQuotaNotifier.Start();
    }

    if (settings.instanceQuota > 0) {
      const arbiter = new InstanceQuota(this.pluginManager, this.recorder);
      arbiter.Quota = settings.instanceQuota;

      this.pluginManagerController.AddArbiter(arbiter, INSTANCE_QUOTA_ID);
    }

    if (settings.downloadSpeedQuota > 0) {
      const arbiter = new DownloadSpeedQuota(this.pluginManager, this.recorder);
      arbiter.Quota = settings.downloadSpeedQuota;

      RpcRequestHandlerImpl.pluginListenerInterceptFn = e => arbiter.StreamFilter(e);
      this.pluginManagerListener.AddInterceptor(RpcRequestHandlerImpl.pluginListenerInterceptFn);

      this.pluginManagerController.AddArbiter(arbiter, DOWNLOAD_SPEED_QUOTA);
    }
  }

  private async Shutdown() {
    Logger.Get.Log('Shutting down. Waiting for recorder stops.');
    const StopRecorder = () => {
      return new Promise<void>((resolve) => {
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
          if (--awaitedRecordings === 0) { resolve(); }
        });
      });
    };
    await StopRecorder();
    Logger.Get.Log('Exit');
    process.exit(0);
  }
}

const app = new App();
app.Run();
