import * as fs from 'fs';
import * as memoizee from 'memoizee';
import * as Path from 'path';
import 'reflect-metadata';
import * as socketIo from 'socket.io';
import * as Util from 'util';
import { PushSubscription } from 'web-push';

import { Config as C } from './BootstrapConfiguration';
import { Event } from './Common/Event';
import { SystemResourcesMonitor } from './Common/Services/SystemResourcesMonitor';
import { StreamDispatcher } from './Common/StreamDispatcher';
import { ArchiveRecord, ObservableStream, TrackedStreamCollection } from './Common/Types';
import { AIE, FindDanglingEntries, IE } from './Common/Util';
import { ARCHIVE_FOLDER, THUMBNAIL_FOLDER } from './Constants';
import { NotificationCenter } from './Services/NotificationCenter';
import { PluginManager } from './Services/PluginManager';
import { RecordingService } from './Services/RecordingService';
import { SqliteAdapter } from './Services/SqliteAdapter';

type MTable = Map<string, (...args: any) => any>;

interface Request {
    callId: number;
    method: string;
    args: any[];
}

interface Response {
    callId: number;
    result: {};
}

export function RpcMethod(name: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        if (Reflect.hasMetadata('mtable', target)) {
            const mtable: MTable = Reflect.getMetadata('mtable', target);
            mtable.set(name, descriptor.value);
        } else {
            Reflect.defineMetadata('mtable', new Map([[name, descriptor.value]]), target);
        }
    };
}

export class RpcRequestHandler {
    private readonly RPC_EVENT = 'rpc';

    public constructor(protected client: socketIo.Socket) {
        client.on(this.RPC_EVENT, async (req: Request) => this.RpcResponse(req, await this.Call(req.method, req.args)));
        client.on('disconnect', () => console.log('client disconnected'));
    }

    private Call(name: string, args: any[]) {
        const mtable: MTable = Reflect.getMetadata('mtable', this);
        const method = mtable.get(name);

        if (method)
            return method.call(this, ...args);
        else
            this.UnknownMethod();
        return { result: false, reason: 'Unknown method call' };
    }

    private RpcResponse(req: Request, result: any) {
        const response: Response = { callId: req.callId, result };
        this.client.emit(this.RPC_EVENT, response);
    }

    private UnknownMethod() {
        console.log('Unknown method call.');
    }
}

interface AddObservableResponse {
    result: boolean;
    reason: string;
}

export class RpcRequestHandlerImpl extends RpcRequestHandler {
    private FindDanglingEntries = memoizee(FindDanglingEntries, { max: 1, maxAge: 1000 });
    public constructor(
        client: socketIo.Socket,
        private io: SocketIO.Server,
        private observables: TrackedStreamCollection,
        private pluginManager: PluginManager,
        private storage: SqliteAdapter,
        private linkedStreams: StreamDispatcher,
        private archive: ArchiveRecord[],
        private recorder: RecordingService,
        private systemResources: SystemResourcesMonitor,
        private notificationCenter: NotificationCenter,
        private readyRecordTunnel: Event<void>) {
        super(client);
        this.SendSnapshot();
    }

    private SendSnapshot() {
        const SerializeObservable = (x: ObservableStream) => ({
            uri: x.url,
            lastSeen: x.lastSeen,
            plugins: x.plugins.map(p => p.name)
        });
        this.client.emit('snapshot', {
            activeRecords: this.recorder.Records,
            archive: this.archive,
            observables: [...this.observables.values()].map(SerializeObservable),
            plugins: this.pluginManager.Plugins.map(x => ({ id: x.id, name: x.name, enabled: x.enabled })),
            systemResources: this.systemResources.Info,
            startTime: C.StartTime
        });
    }

    private KnownRecords() {
        return [...this.recorder.Records.map(x => x.filename), ...this.archive.map(x => x.filename)];
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

        this.io.emit('AddObservable',
            { uri: observable.url, lastSeen: observable.lastSeen, plugins: observable.plugins.map(x => x.name) });

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

        this.io.emit('RemoveObservable', url);

        return true;
    }

    @RpcMethod('ReorderPlugin')
    private ReorderPlugin(index: number, newIndex: number): boolean {
        if (index >= this.pluginManager.Plugins.length || newIndex >= this.pluginManager.Plugins.length) {
            return false;
        }

        this.pluginManager.ReorderPlugin(index, newIndex);

        this.storage.ReorderPlugin(index, newIndex);

        this.io.emit('ReorderPlugin', [index, newIndex]);

        return true;

    }

    @RpcMethod('EnablePlugin')
    private EnablePlugin(id: number, enabled: boolean): boolean {

        this.pluginManager.EnablePlugin(id, enabled);

        enabled ?
            this.linkedStreams.RedistributeToEnabledPlugin(id) :
            this.linkedStreams.RedistributeFromDisabledPlugin(id);

        this.storage.EnablePlugin(id, enabled);

        this.io.emit('EnablePlugin', [id, enabled]);
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

        this.io.emit('ReorderObservablePlugin', [uri, oldIndex, newIndex]);
        return true;
    }

    @RpcMethod('StopRecording')
    private StopRecording(label: string): boolean {

        if (!this.recorder.StopRecording(label)) {
            return false;
        }

        this.io.emit('RemoveRecording', label);

        return true;
    }

    @RpcMethod('RemoveArchiveRecord')
    private RemoveArchiveRecord(filename: string) {
        const removableIdx = this.archive.findIndex(x => x.filename === filename);

        if (removableIdx === -1)
            return false;

        this.archive.splice(removableIdx, 1);

        this.storage.RemoveArchiveRecord(filename);

        IE(fs.unlinkSync, Path.join(ARCHIVE_FOLDER, filename));
        IE(fs.unlinkSync, Path.join(THUMBNAIL_FOLDER, filename.slice(0, filename.lastIndexOf('.')) + '.jpg'));

        this.io.emit('RemoveArchiveRecord', filename);

        return true;
    }

    @RpcMethod('Shutdown')
    private async Shutdown() {
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
        process.exit(0);
    }

    @RpcMethod('GetVAPID')
    private GetVAPID(): string | false {
        if (!C.WebPushEnabled)
            return false;

        return C.VAPID!.publicKey;
    }

    @RpcMethod('SendSubscription')
    private SendSubscription(subscription: PushSubscription) {
        this.notificationCenter.AddSubscription(subscription);
        return true;
    }

    @RpcMethod('ValidateEndpoint')
    private ValidateEndpoint(endpoint: string) {
        return this.notificationCenter.HasSubscription(endpoint);
    }

    @RpcMethod('DanglingRecordsSummary')
    private async DanglingRecordsSummary() {
        const entries = await this.FindDanglingEntries(ARCHIVE_FOLDER, this.KnownRecords());
        return { count: entries.length, size: entries.reduce((size, x) => x.size + size, 0) };
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
}
