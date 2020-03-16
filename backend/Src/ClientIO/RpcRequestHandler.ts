import * as fs from 'fs';
import * as Jwt from 'jsonwebtoken';
import * as memoizee from 'memoizee';
import * as Path from 'path';
import 'reflect-metadata';
import { Socket } from 'socket.io';
import * as Util from 'util';
import { PushSubscription } from 'web-push';

import { AppAccessType, Ref } from '@Shared/Types';
import { Config as C } from '../BootstrapConfiguration';
import { LinkCounter } from '../Common/LinkCounter';
import { StreamDispatcher } from '../StreamDispatcher';
import { ThrottleEvent } from './../Common/Event';
import { ClipMaker, FFMpegProgressInfo, ThumbnailGenerator } from './../Common/FFmpeg';
import { Logger } from './../Common/Logger';
import { ArchiveRecord, ClipProgress, ObservableStream, TrackedStreamCollection } from './../Common/Types';
import { FileSize, FindDanglingEntries, GenClipFilename, IE, Timestamp } from './../Common/Util';
import { ARCHIVE_FOLDER, JWT_TTL, THUMBNAIL_FOLDER } from './../Constants';
import { NotificationCenter } from './../Services/NotificationCenter';
import { PluginManager } from './../Services/PluginManager';
import { RecordingService } from './../Services/RecordingService';
import { SqliteAdapter } from './../Services/SqliteAdapter';
import { SystemResourcesMonitor } from './../Services/SystemResourcesMonitor';
import { Broadcaster } from './Broadcaster';
import { Unicaster } from './Unicaster';

type MTable = Map<string, { fn: (...args: any) => any, access: AppAccessType }>;

interface Request {
    callId: number;
    method: string;
    args: any[];
}

interface Response {
    callId: number;
    result: {};
}

export function RpcMethod<T>(name: string, access: AppAccessType = AppAccessType.FULL_ACCESS) {
    return (target: T, propertyKey: string, descriptor: PropertyDescriptor) => {
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
    public Log(msg: string) {
        Logger.Get.Log(`[${this.client.id}] ${msg}`);
    }

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
        } else {
            this.UnknownMethod(name);
        }
        return { result: false, reason: 'Unknown method call' };
    }

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
    private accessCleaner: NodeJS.Timeout | null = null;
    private FindDanglingEntries = memoizee(FindDanglingEntries, { max: 1, maxAge: 1000 });
    private session: Ref<Unicaster> = null;
    public constructor(
        client: Socket,
        private broadcaster: Broadcaster,
        private observables: TrackedStreamCollection,
        private pluginManager: PluginManager,
        private storage: SqliteAdapter,
        private linkedStreams: StreamDispatcher,
        private archive: ArchiveRecord[],
        private archiveRefCounter: LinkCounter<string>,
        private clipProgress: Map<string, ClipProgress>,
        private recorder: RecordingService,
        private systemResources: SystemResourcesMonitor,
        private notificationCenter: NotificationCenter,
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
            plugins: x.plugins.map(p => p.name)
        });
        this.session?.Snapshot({
            activeRecords: this.recorder.Records,
            archive: this.archive,
            clipProgress: [...this.clipProgress.values()],
            observables: [...this.observables.values()].map(SerializeObservable),
            plugins: this.pluginManager.Plugins.map(x => ({ id: x.id, name: x.name, enabled: x.enabled })),
            systemResources: this.systemResources.Info,
            startTime: C.StartTime,
            defaultAccess: C.DefaultAccess
        });
    }

    private KnownRecords() {
        return [...this.recorder.Records.map(x => x.filename), ...this.archive.map(x => x.filename)];
    }
    private OnDisconnect() {
        if (this.accessCleaner)
            clearTimeout(this.accessCleaner);
    }
    private ResetAccess() {
        this.clientAccess = C.DefaultAccess;
        this.session?.ResetAccess();
    }
    @RpcMethod('AddObservable')
    private AddObservable(url: string): AddObservableResponse {
        if (this.observables.has(url)) {
            return { result: false, reason: 'Uri already Added' };
        }

        const plugins = this.pluginManager.FindCompatiblePlugin(url);

        if (plugins.length === 0) {
            return { result: false, reason: 'No compatible plugin that can process it' };
        }

        const observable: ObservableStream = { url, lastSeen: -1, plugins };

        if (!this.storage.AddObservable(observable))
            return { result: false, reason: 'Uri already Added' };

        this.observables.set(url, observable);
        this.linkedStreams.Add(url);

        this.broadcaster.AddObservable(
            {
                uri: observable.url,
                lastSeen: observable.lastSeen,
                plugins: observable.plugins.map(x => x.name)
            });

        this.Log(`Source added ${url}`);
        return { result: true, reason: 'Added' };
    }

    @RpcMethod('RemoveObservable')
    private RemoveObservable(url: string): boolean {
        const rm = this.observables.get(url);

        if (rm === undefined) {
            return false;
        }

        const recorderInstance = this.recorder.Records.find(x => x.label === url);
        if (recorderInstance)
            this.recorder.StopRecording(recorderInstance.label);
        else
            this.linkedStreams.Remove(url);

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

        if (!this.storage.ReorderObservablePlugin(uri, oldIndex, newIndex))
            return false;

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

        if (removableIdx === -1 || this.archive[removableIdx].locked)
            return false;

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
        if (!C.WebPushEnabled)
            return false;

        return C.VAPID!.publicKey;
    }

    @RpcMethod('SendSubscription', AppAccessType.VIEW_ACCESS)
    private SendSubscription(subscription: PushSubscription) {
        this.notificationCenter.AddSubscription(subscription);
        return true;
    }

    @RpcMethod('ValidateEndpoint', AppAccessType.VIEW_ACCESS)
    private ValidateEndpoint(endpoint: string) {
        return this.notificationCenter.HasSubscription(endpoint);
    }

    @RpcMethod('DanglingRecordsSummary', AppAccessType.VIEW_ACCESS)
    private async DanglingRecordsSummary() {
        const entries = await this.FindDanglingEntries(ARCHIVE_FOLDER, this.KnownRecords());
        return { count: entries.length, size: entries.reduce((size, x) => x.size + size, 0) };
    }

    @RpcMethod('MakeClip')
    private async MakeClip(source: string, begin: number, end: number) {
        const target = this.archive.find(x => x.filename === source);
        if (target === undefined)
            return;

        this.archiveRefCounter.Capture(source);
        if (target.locked !== this.archiveRefCounter.Captured(source)) {
            target.locked = this.archiveRefCounter.Captured(source);
            this.broadcaster.LockRecord(source);
        }

        const destName = GenClipFilename(source);
        const dest = Path.join(ARCHIVE_FOLDER, destName);
        const clipMaker = new ClipMaker(Path.join(ARCHIVE_FOLDER, source), begin, end, dest);

        const duration = end - begin;
        this.broadcaster.NewClipProgress({ label: destName, duration });

        const progressEvent = new ThrottleEvent<FFMpegProgressInfo>(1000);
        progressEvent.On(x => {
            const progress = Math.round(x.time / duration / 10);
            this.clipProgress.get(destName)!.progress = progress;
            this.broadcaster.ClipProgress({ label: destName, progress });
        });

        this.clipProgress.set(destName, { label: destName, duration, progress: 0 });

        clipMaker.Progress.On((x: FFMpegProgressInfo) => progressEvent.Emit(x));
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

            const clip = {
                title: destName,
                source: target.source,
                filename: destName,
                duration,
                size: await FileSize(dest),
                timestamp: Timestamp(),
                locked: false
            };
            this.clipProgress.delete(destName);
            this.archive.push(clip);
            this.broadcaster.AddArchiveRecord(clip);
            this.storage.AddArchiveRecord(clip);

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
        const entries = await this.FindDanglingEntries(ARCHIVE_FOLDER, this.KnownRecords());

        let skiped = 0;
        for (const x of entries) {
            try {
                await unlink(Path.join(ARCHIVE_FOLDER, x.filename));
            } catch (e) {
                ++skiped;
            }
        }
        return skiped;
    }
    @RpcMethod('GenerateAccessToken', AppAccessType.NO_ACCESS)
    private GenerateAccessToken(passphrase: string) {
        return passphrase === C.AccessPassphrase ?
            Jwt.sign({}, C.JwtSecret, { expiresIn: JWT_TTL }) :
            '';
    }
    @RpcMethod('UpgradeAccess', AppAccessType.NO_ACCESS)
    private UpgradeAccess(token: string) {
        try {
            const ct = (Jwt.verify(token, C.JwtSecret) as DecryptedToken);
            this.accessCleaner = setTimeout(() => this.ResetAccess(), ct.exp * 1000 - Date.now());
            this.clientAccess = AppAccessType.FULL_ACCESS;
            return true;
        } catch (e) {
            return false;
        }
    }
}
