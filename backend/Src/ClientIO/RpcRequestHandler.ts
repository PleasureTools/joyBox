import 'reflect-metadata';

import * as fs from 'fs';
import * as Jwt from 'jsonwebtoken';
import * as memoizee from 'memoizee';
import * as Path from 'path';
import * as pb from 'pretty-bytes';
import { interval, Subject } from 'rxjs';
import { throttle } from 'rxjs/operators';
import { Socket } from 'socket.io';
import * as Util from 'util';
import { PushSubscription } from 'web-push';

import { PluginManagerListener } from '../PluginManagerListener';
import { LiveStream } from '../Plugins/Plugin';
import { PluginManagerController } from '../Services/PluginManager/PluginManagerController';
import { DOWNLOAD_SPEED_QUOTA, INSTANCE_QUOTA_ID, STORAGE_QUOTA_ID } from '../Services/PluginManager/Quotas/Constants';
import { Settings } from '../Settings';
import { AppAccessType, Filter, ArchiveRecord, ClipProgressState, Playlist, NotificationType } from '@Shared/Types';
import { Config as C } from '../BootstrapConfiguration';
import { LinkCounter } from '../Common/LinkCounter';
import { StreamDispatcher } from '../StreamDispatcher';
import { ClipMaker, FFMpegProgressInfo, ThumbnailGenerator, ReencodingMode } from './../Common/FFmpeg';
import { Logger } from './../Common/Logger';
import { ObservableStream, TrackedStreamCollection } from './../Common/Types';
import { FileSize, FindDanglingEntries, GenClipFilename, IE, NormalizeUrl, ParseObservableUrl, Rename, Timestamp } from './../Common/Util';
import { ARCHIVE_FOLDER, INCOMPLETE_FOLDER, JWT_PROLONGATION_TTL, JWT_TTL, THUMBNAIL_FOLDER } from './../Constants';
import { NotificationCenter } from './../Services/NotificationCenter';
import { PluginManager } from './../Services/PluginManager';
import { RecordingService } from './../Services/RecordingService';
import { SqliteAdapter } from './../Services/SqliteAdapter';
import { SystemResourcesMonitor } from './../Services/SystemResourcesMonitor';
import { Broadcaster } from './Broadcaster';
import { Unicaster } from './Unicaster';

import { DownloadSpeedQuota } from '../Services/PluginManager/Quotas/DownloadSpeedQuota';
import { InstanceQuota } from '../Services/PluginManager/Quotas/InstanceQuota';
import { StorageQuota } from '../Services/PluginManager/Quotas/StorageQuota';
import { AppFacade } from '../AppFacade';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MTable = Map<string, { fn: (...args: any) => any, access: AppAccessType }>;

interface Request {
  callId: number;
  method: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[];
}

interface Response {
  callId: number;
  // eslint-disable-next-line @typescript-eslint/ban-types
  result: {};
}

export function RpcMethod(name: string, access: AppAccessType = AppAccessType.FULL_ACCESS) {
  return (target: RpcRequestHandlerImpl, propertyKey: string, descriptor: PropertyDescriptor): void => {
    if (Reflect.hasMetadata('mtable', target)) {
      const mtable: MTable = Reflect.getMetadata('mtable', target);
      mtable.set(name, { fn: descriptor.value, access });
    } else {
      Reflect.defineMetadata('mtable', new Map([[name, { fn: descriptor.value, access }]]), target);
    }
  };
}

export class RpcRequestHandler {
  protected clientAccess: AppAccessType = C.DefaultAccess;
  private readonly RPC_EVENT = 'rpc';
  public constructor(protected client: Socket) {
    client.on(this.RPC_EVENT, async (req: Request) => this.RpcResponse(req, await this.Call(req.method, req.args)));
  }

  public Log(msg: string): void {
    Logger.Get.Log(`[${this.client.id}] ${msg}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private Call(name: string, args: any[]) {
    const mtable: MTable = Reflect.getMetadata('mtable', this);
    const method = mtable.get(name);

    if (method) {
      if (this.clientAccess >= method.access) {
        return method.fn.call(this, ...args);
      } else {
        this.ForbiddenMethodCall(name);
        return { result: false, reason: 'Forbidden method call' };
      }
    }

    this.UnknownMethod(name);
    return { result: false, reason: 'Unknown method call' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private RpcResponse(req: Request, result: any) {
    const response: Response = { callId: req.callId, result };
    this.client.emit(this.RPC_EVENT, response);
  }

  private UnknownMethod(method: string) {
    this.Log(`Unknown method '${method}' call.`);
  }

  private ForbiddenMethodCall(method: string) {
    this.Log(`Forbidden method '${method}' call.`);
  }
}

interface AddObservableResponse {
  result: boolean;
  reason: string;
}
interface DecryptedToken {
  iat: number;
  exp: number;
}
export class RpcRequestHandlerImpl extends RpcRequestHandler {
  public static pluginListenerInterceptFn: (e: LiveStream) => boolean;
  private readonly BEFORE_EXP = 5;
  private sessionProlongationTask: NodeJS.Timeout | null = null;
  private FindDanglingEntries = memoizee(FindDanglingEntries, { max: 1, maxAge: 1000 });
  private session: Unicaster | null = null;
  public constructor(
    client: Socket,
    private broadcaster: Broadcaster,
    private observables: TrackedStreamCollection,
    private pluginManager: PluginManager,
    private pluginManagerController: PluginManagerController,
    private pluginManagerListener: PluginManagerListener,
    private storage: SqliteAdapter,
    private linkedStreams: StreamDispatcher,
    private archive: ArchiveRecord[],
    private archiveRefCounter: LinkCounter<string>,
    private clipProgress: Map<string, ClipProgressState>,
    private archiveFilters: Map<number, Filter>,
    private observablesFilters: Map<number, Filter>,
    private recorder: RecordingService,
    private systemResources: SystemResourcesMonitor,
    private notificationCenter: NotificationCenter,
    private settings: Settings,
    private app: AppFacade,
    private shutdown: () => void) {
    super(client);
    this.session = new Unicaster(this.client);
    this.client.once('disconnect', () => this.OnDisconnect());
    this.SendSnapshot();
  }

  private SendSnapshot() {
    const SerializeObservable = (x: ObservableStream) => ({
      uri: x.url,
      lastSeen: x.lastSeen,
      download: x.download,
      valid: x.valid,
      plugins: x.plugins.map(p => p.name)
    });

    this.session?.Snapshot({
      activeRecords: this.recorder.Records,
      archive: this.archive.map(x => ({ ...x, tags: [...x.tags] })),
      playlists: this.app.Playlists,
      clipProgress: [...this.clipProgress.values()],
      observables: [...this.observables.values()].map(SerializeObservable),
      plugins: this.pluginManager.Plugins.map(x => ({ id: x.id, name: x.name, enabled: x.enabled })),
      archiveFilters: [...this.archiveFilters.values()],
      observablesFilters: [...this.observablesFilters.values()],
      systemResources: this.systemResources.Info,
      startTime: C.StartTime,
      defaultAccess: C.DefaultAccess,
      storageQuota: this.settings.StorageQuota,
      instanceQuota: this.settings.InstanceQuota,
      downloadSpeedQuota: this.settings.DownloadSpeedQuota,
      remoteSeleniumUrl: this.settings.RemoteSeleniumUrl
    });
  }

  private KnownRecords() {
    return [...this.recorder.Records.map(x => x.filename), ...this.archive.map(x => x.filename)];
  }

  private OnDisconnect() {
    if (this.sessionProlongationTask) { clearTimeout(this.sessionProlongationTask); }
  }

  private ProlongateSession() {
        this.session?.ProlongateSession(Jwt.sign({}, C.JwtSecret, { expiresIn: JWT_PROLONGATION_TTL }));
        this.sessionProlongationTask =
            setTimeout(() => this.ProlongateSession(), (JWT_PROLONGATION_TTL - this.BEFORE_EXP) * 1000);
  }

  @RpcMethod('AddObservable')
  private AddObservable(url: string): AddObservableResponse {
    const nUrl = NormalizeUrl(url);

    if (this.observables.has(nUrl)) {
      return { result: false, reason: 'Uri already Added' };
    }

    const plugins = this.pluginManager.FindCompatiblePlugin(nUrl);

    let observable: ObservableStream;

    const known = this.storage.FindObservable(nUrl);
    if (known !== null) {
      observable = { url: nUrl, lastSeen: known.lastSeen, download: known.download, valid: known.valid, plugins };

      this.storage.RestoreObservable(nUrl);
      this.storage.UpdateObservablePlugins(nUrl, plugins);
    } else {
      if (plugins.length === 0) {
        return { result: false, reason: 'No compatible plugin that can process it' };
      }

      observable = { url: nUrl, lastSeen: -1, download: 0, valid: true, plugins };

      if (!this.storage.AddObservable(observable)) { return { result: false, reason: 'Uri already Added' }; }
    }

    this.observables.set(nUrl, observable);
    this.linkedStreams.Add(nUrl);

    this.broadcaster.AddObservable(
      {
        uri: observable.url,
        lastSeen: observable.lastSeen,
        download: observable.download,
        valid: observable.valid,
        plugins: observable.plugins.map(x => x.name)
      });

    this.Log(`Source added ${nUrl}`);
    return { result: true, reason: 'Added' };
  }

  @RpcMethod('RemoveObservable')
  private RemoveObservable(url: string): boolean {
    const rm = this.observables.get(url);

    if (rm === undefined) {
      return false;
    }

    const recorderInstance = this.recorder.Records.find(x => x.label === url);
    if (recorderInstance) { this.recorder.StopRecording(recorderInstance.label); } else { this.linkedStreams.Remove(url); }

    this.observables.delete(url);

    this.storage.RemoveObservable(url);

    this.broadcaster.RemoveObservable(url);

    this.Log(`Source removed ${url}`);
    return true;
  }

  @RpcMethod('ReorderPlugin')
  private ReorderPlugin(index: number, newIndex: number): boolean {
    if (index >= this.pluginManager.Plugins.length || newIndex >= this.pluginManager.Plugins.length) {
      return false;
    }

    this.pluginManager.ReorderPlugin(index, newIndex);

    this.storage.ReorderPlugin(index, newIndex);

    this.broadcaster.RedorderPlugin([index, newIndex]);

    return true;
  }

  @RpcMethod('EnablePlugin')
  private EnablePlugin(id: number, enabled: boolean): boolean {
    this.pluginManager.EnablePlugin(id, enabled);

    enabled ?
      this.linkedStreams.RedistributeToEnabledPlugin(id) :
      this.linkedStreams.RedistributeFromDisabledPlugin(id);

    this.storage.EnablePlugin(id, enabled);

    this.broadcaster.EnablePlugin([id, enabled]);
    return true;
  }

  @RpcMethod('ReorderObservablePlugin')
  private ReorderObservablePlugin(uri: string, oldIndex: number, newIndex: number): boolean {
    const targetObservable = this.observables.get(uri);

    if (targetObservable === undefined) {
      return false;
    }

    const MIN_COUNT_FOR_REORDERING = 2;
    if (targetObservable.plugins.length < MIN_COUNT_FOR_REORDERING) {
      return false;
    }

    if (!this.storage.ReorderObservablePlugin(uri, oldIndex, newIndex)) { return false; }

    const oldPlugin = this.linkedStreams.GetActivePlugin(targetObservable.url);
    targetObservable.plugins.splice(newIndex, 0, targetObservable.plugins.splice(oldIndex, 1)[0]);
    const newPlugin = this.linkedStreams.GetActivePlugin(targetObservable.url);

    if (!(oldPlugin === null || newPlugin === null || oldPlugin === newPlugin)) {
      this.linkedStreams.Move(uri, oldPlugin.id, newPlugin.id);
    }

    this.broadcaster.ReorderObservablePlugin([uri, oldIndex, newIndex]);
    return true;
  }

  @RpcMethod('StopRecording')
  private StopRecording(label: string): boolean {
    if (!this.recorder.StopRecording(label)) {
      return false;
    }

    this.broadcaster.RemoveRecording(label);

    return true;
  }

  @RpcMethod('RemoveArchiveRecord')
  private RemoveArchiveRecord(filename: string) {
    const removableIdx = this.archive.findIndex(x => x.filename === filename);

    if (removableIdx === -1 || this.archive[removableIdx].locked) { return false; }

    this.archive.splice(removableIdx, 1);

    this.storage.RemoveArchiveRecord(filename);

    IE(fs.unlinkSync, Path.join(ARCHIVE_FOLDER, filename));
    IE(fs.unlinkSync, Path.join(THUMBNAIL_FOLDER, filename.slice(0, filename.lastIndexOf('.')) + '.jpg'));

    this.broadcaster.RemoveArchiveRecord(filename);

    this.Log(`Archive record removed ${filename}`);
    return true;
  }

  @RpcMethod('Shutdown')
  private async Shutdown() {
    this.shutdown();
  }

  @RpcMethod('GetVAPID', AppAccessType.VIEW_ACCESS)
  private GetVAPID(): string | false {
    if (!C.WebPushEnabled) { return false; }

    return C.VAPID?.publicKey ?? '';
  }

  @RpcMethod('SendSubscription', AppAccessType.VIEW_ACCESS)
  private SendSubscription(subscription: PushSubscription, notification: NotificationType) {
    this.notificationCenter.AddSubscription(subscription, notification);
    return true;
  }

  @RpcMethod('AddNotification', AppAccessType.VIEW_ACCESS)
  private AddNotification(endpoint: string, notification: NotificationType) {
    return this.notificationCenter.AddNotification(endpoint, notification);
  }

  @RpcMethod('RemoveNotification', AppAccessType.VIEW_ACCESS)
  private RemoveNotification(endpoint: string, notification: NotificationType) {
    this.notificationCenter.RemoveNotification(endpoint, notification);
  }

  @RpcMethod('RetrieveNotifications')
  private RetrieveNotifications(endpoint: string) {
    return this.notificationCenter.RetrieveNotifications(endpoint);
  }

  @RpcMethod('ValidateEndpoint', AppAccessType.VIEW_ACCESS)
  private ValidateEndpoint(endpoint: string) {
    return this.notificationCenter.HasSubscription(endpoint);
  }

  @RpcMethod('DanglingRecordsSummary', AppAccessType.VIEW_ACCESS)
  private async DanglingRecordsSummary() {
    const entries = await this.FindDanglingEntries(INCOMPLETE_FOLDER, this.KnownRecords());
    return { count: entries.length, size: entries.reduce((size, x) => x.size + size, 0) };
  }

  @RpcMethod('FindUntrackedVideos')
  private async FindUntrackedVideos() {
    return await this.FindDanglingEntries(ARCHIVE_FOLDER, this.KnownRecords());
  }

  @RpcMethod('LinkVideo')
  private async LinkVideo(filename: string, title: string, source: string, newFilename: string) {
    if (Path.parse(newFilename).ext !== '.mp4') { return false; }

    let filenameAbs = Path.join(ARCHIVE_FOLDER, filename);
    const newFilenameAbs = Path.join(ARCHIVE_FOLDER, newFilename);

    if (filename !== newFilename) {
      await Rename(filenameAbs, newFilenameAbs);
      filenameAbs = newFilenameAbs;
    }

    this.app.AddToArchive(filenameAbs, title, source);

    return true;
  }

  @RpcMethod('MakeClip')
  private async MakeClip(source: string, begin: number, end: number, reencode: boolean) {
    const target = this.archive.find(x => x.filename === source);
    if (target === undefined) { return; }

    this.archiveRefCounter.Capture(source);
    if (target.locked !== this.archiveRefCounter.Captured(source)) {
      target.locked = this.archiveRefCounter.Captured(source);
      this.broadcaster.LockRecord(source);
    }

    const destName = GenClipFilename(source);
    const dest = Path.join(ARCHIVE_FOLDER, destName);

    const reencodeMode = reencode ?
      process.env.REENCODING_MODE === 'hardware' ? ReencodingMode.Hardware : ReencodingMode.Software :
      ReencodingMode.Copy;

    const clipMaker = new ClipMaker(Path.join(ARCHIVE_FOLDER, source), begin, end, dest, reencodeMode);

    const duration = end - begin;
    this.broadcaster.NewClipProgress({ label: destName, duration });

    const creationStart = Timestamp();
    const Eta = (progress: number) => Math.round((Timestamp() - creationStart) / progress * (100 - progress));
    const progressEvent = new Subject<FFMpegProgressInfo>();
    const progressEventUnsub = progressEvent
      .pipe(throttle(_ => interval(1000)))
      .subscribe(x => {
        const progress = Math.round(x.time / duration / 10);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.clipProgress.get(destName)!.progress = progress;
        this.broadcaster.ClipProgress({ label: destName, progress, eta: Eta(progress) });
      });

    this.clipProgress.set(destName, { label: destName, duration, progress: 0, eta: 0 });

    clipMaker.Progress.On((x: FFMpegProgressInfo) => progressEvent.next(x));
    clipMaker.Complete.On(async (success: boolean) => {
      this.archiveRefCounter.Release(source);
      if (target.locked !== this.archiveRefCounter.Captured(source)) {
        target.locked = this.archiveRefCounter.Captured(source);
        this.broadcaster.UnlockRecord(source);
      }

      if (!success) {
        this.broadcaster.RemoveClipProgress(destName);
        return;
      }

      const thumbnail = new ThumbnailGenerator();
      await thumbnail.Generate(dest,
        duration / 10,
        Path.join(THUMBNAIL_FOLDER, Path.parse(dest).name));

      const ob = ParseObservableUrl(target.source);
      const title = ob ? `${ob.provider}/${ob.channel} clip` : target.source;
      const clip = {
        title,
        source: target.source,
        filename: destName,
        duration,
        size: await FileSize(dest),
        reencoded: target.reencoded || reencode,
        timestamp: Timestamp(),
        locked: false,
        tags: new Set<string>()
      };
      progressEventUnsub.unsubscribe();
      progressEvent.unsubscribe();
      this.clipProgress.delete(destName);

      this.app.AddArchiveRecord(clip);

      this.Log(`New clip ${clip.filename} based on ${source}`);
    });
  }

  @RpcMethod('FetchRecentLogs', AppAccessType.VIEW_ACCESS)
  private FetchRecentLogs(fromTm: number, limit: number) {
    return this.storage.FetchRecentLogs(fromTm, limit);
  }

  /**
     * @returns 0 - ok, or count of items that wasn't deleted
     */
  @RpcMethod('RemoveDanglingRecords')
  private async RemoveDanglingRecords() {
    const unlink = Util.promisify(fs.unlink);
    const entries = await this.FindDanglingEntries(INCOMPLETE_FOLDER, this.KnownRecords());

    let skiped = 0;
    for (const x of entries) {
      try {
        await unlink(Path.join(INCOMPLETE_FOLDER, x.filename));
      } catch (e) {
        ++skiped;
      }
    }
    return skiped;
  }

  @RpcMethod('GenerateAccessToken', AppAccessType.NO_ACCESS)
  private GenerateAccessToken(passphrase: string) {
    if (passphrase === C.AccessPassphrase) { return Jwt.sign({}, C.JwtSecret, { expiresIn: JWT_TTL }); }

    this.Log('Entered wrong passphrase');

    return '';
  }

  @RpcMethod('UpgradeAccess', AppAccessType.NO_ACCESS)
  private UpgradeAccess(token: string) {
    try {
      const ct = (Jwt.verify(token, C.JwtSecret) as DecryptedToken);
      this.sessionProlongationTask =
                setTimeout(() => this.ProlongateSession(), (ct.exp - this.BEFORE_EXP) * 1000 - Date.now());
      this.clientAccess = AppAccessType.FULL_ACCESS;
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
     * Set storage limit
     * @param quota new limit in bytes. 0 - ni limit
     */
  @RpcMethod('SetStorageQuota')
  private SetStorageQuota(quota: number) {
    if (this.settings.StorageQuota === quota || quota < 0) { return; }

    if (this.settings.StorageQuota === 0 && quota > 0) {
      const arbiter = new StorageQuota(this.recorder, this.systemResources);
      this.pluginManagerController.AddArbiter(arbiter, STORAGE_QUOTA_ID);
    } else if (quota === 0) {
      this.pluginManagerController.RemoveArbiter(STORAGE_QUOTA_ID);
    }

    Logger.Get.Log(`Storage quota changed from ${pb(this.settings.StorageQuota)} to ${pb(quota)}`);

    const sq = this.pluginManagerController.Find(STORAGE_QUOTA_ID);
    if (sq !== null) { (sq as StorageQuota).Quota = quota; }

    this.settings.StorageQuota = quota;
    this.broadcaster.UpdateStorageQuota(quota);
  }

  @RpcMethod('SetInstanceQuota')
  private SetInstanceQuota(quota: number) {
    if (this.settings.InstanceQuota === quota || quota < 0) { return; }

    if (this.settings.InstanceQuota === 0 && quota > 0) {
      const arbiter = new InstanceQuota(this.pluginManager, this.recorder);
      this.pluginManagerController.AddArbiter(arbiter, INSTANCE_QUOTA_ID);

      this.app.SizeQuotaNotifier.UpdateQuota(quota);
      if (!this.app.SizeQuotaNotifier.IsRunning) {
        this.app.SizeQuotaNotifier.Start();
      }
    } else if (quota === 0) {
      this.pluginManagerController.RemoveArbiter(INSTANCE_QUOTA_ID);
      this.app.SizeQuotaNotifier.Stop();
    }

    Logger.Get.Log(`Instance quota changed from ${this.settings.InstanceQuota} to ${quota}`);

    const sq = this.pluginManagerController.Find(INSTANCE_QUOTA_ID);
    if (sq !== null) { (sq as InstanceQuota).Quota = quota; }

    this.settings.InstanceQuota = quota;
    this.broadcaster.UpdateInstanceQuota(quota);
  }

  @RpcMethod('SetDownloadSpeedQuota')
  private SetDownloadSpeedQuota(quota: number) {
    if (this.settings.DownloadSpeedQuota === quota || quota < 0) { return; }

    if (this.settings.DownloadSpeedQuota === 0 && quota > 0) {
      const arbiter = new DownloadSpeedQuota(this.pluginManager, this.recorder);
      RpcRequestHandlerImpl.pluginListenerInterceptFn = e => arbiter.StreamFilter(e);
      this.pluginManagerListener.AddInterceptor(RpcRequestHandlerImpl.pluginListenerInterceptFn);
      this.pluginManagerController.AddArbiter(arbiter, DOWNLOAD_SPEED_QUOTA);
    } else if (quota === 0) {
      this.pluginManagerListener.RemoveInterceptor(RpcRequestHandlerImpl.pluginListenerInterceptFn);
      this.pluginManagerController.RemoveArbiter(DOWNLOAD_SPEED_QUOTA);
    }

    Logger.Get.Log(`Downlaod speed quota changed from ${pb(this.settings.DownloadSpeedQuota)} to ${pb(quota)}`);

    const sq = this.pluginManagerController.Find(DOWNLOAD_SPEED_QUOTA);
    if (sq !== null) { (sq as DownloadSpeedQuota).Quota = quota; }

    this.settings.DownloadSpeedQuota = quota;
    this.broadcaster.UpdateDownloadSpeedQuota(quota);
  }

  @RpcMethod('SetRemoteSeleniumUrl')
  private SetRemoteSeleniumUrl(url: string) {
    if (this.settings.RemoteSeleniumUrl === '' && url !== '') {
      Logger.Get.Log(`Remote selenium url sets to ${url}`);
    } else if (url === '') {
      Logger.Get.Log('Remote selenium url was unset');
    } else {
      Logger.Get.Log(`Remote selenium url changed from ${this.settings.RemoteSeleniumUrl} to ${url}`);
    }

    this.settings.RemoteSeleniumUrl = url;
    this.broadcaster.UpdateRemoteSeleniumUrl(url);
  }

  @RpcMethod('AttachTagToArchiveRecord')
  private AttachTagToArchiveRecord(filename: string, tag: string) {
    const record = this.archive.find(x => x.filename === filename);

    if (!record) { return; }

    const lcTag = tag.toLowerCase();
    record.tags.add(lcTag);
    this.storage.AttachTagToArchiveRecord(filename, tag);

    this.broadcaster.AttachTagToArchiveRecord(filename, tag);
  }

  @RpcMethod('DetachTagFromArchiveRecord')
  private DetachTagFromArchiveRecord(filename: string, tag: string) {
    const record = this.archive.find(x => x.filename === filename);

    if (!record) { return; }

    const lcTag = tag.toLowerCase();
    if (record.tags.delete(lcTag)) { this.storage.DetachTagFromArchiveRecord(filename, tag); }

    this.broadcaster.DetachTagFromArchiveRecord(filename, tag);
  }

  @RpcMethod('AddArchiveFilter')
  private AddArchiveFilter(name: string, query: string) {
    const id = this.storage.AddArchiveFilter(name, query);

    const filter: Filter = { id, name, query };

    this.archiveFilters.set(id, filter);

    this.broadcaster.AddArchiveFilter(filter);

    return true;
  }

  @RpcMethod('RemoveArchiveFilter')
  private RemoveArchiveFilter(id: number) {
    this.archiveFilters.delete(id);

    this.storage.RemoveArchiveFilter(id);

    this.broadcaster.RemoveArchiveFilter(id);

    return true;
  }

  @RpcMethod('AddObservablesFilter')
  private AddObservablesFilter(name: string, query: string) {
    const id = this.storage.AddObservablesFilter(name, query);

    const filter: Filter = { id, name, query };

    this.observablesFilters.set(id, filter);

    this.broadcaster.AddObservablesFilter(filter);

    return true;
  }

  @RpcMethod('RemoveObservablesFilter')
  private RemoveObservablesFilter(id: number) {
    this.observablesFilters.delete(id);

    this.storage.RemoveObservablesFilter(id);

    this.broadcaster.RemoveObservablesFilter(id);

    return true;
  }

  @RpcMethod('CreatePlaylist')
  private CreatePlaylist(playlist: Playlist) {
    // TODO Validate playlist

    const fiexedPlaylist = { ...playlist, timestamp: Timestamp() };
    const id = this.storage.AddPlaylist(fiexedPlaylist);

    if (id !== -1) {
      fiexedPlaylist.id = id;

      this.app.Playlists.push(fiexedPlaylist);
      this.broadcaster.CreatePlaylist(fiexedPlaylist);
    }

    return true;
  }

  @RpcMethod('RemovePlaylist')
  private RemovePlaylist(id: number) {
    const idx = this.app.Playlists.findIndex(x => x.id === id);

    if (idx === -1) { return false; }

    this.app.Playlists.splice(idx, 1);

    this.storage.RemovePlaylist(id);

    this.broadcaster.RemovePlaylist(id);
  }
}
