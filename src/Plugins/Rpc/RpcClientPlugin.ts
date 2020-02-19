import { RpcClient } from '@/Common';
import { LogItem } from '@Shared/Types';

type AddObservableArgs = [string];
interface AddObservableRet {
    result: boolean;
    reason: string;
}
interface DanglingRecordsSummaryRet {
    count: number;
    size: number;
}

type NoArgs = [];
type RemoveObservableArgs = [string];
type ReorderPluginArgs = [number, number];
type EnablePluginArgs = [number, boolean];
type ReorderObservablePluginArgs = [string, number, number];
type StopRecordingArgs = [string];
type RemoveArchiveRecordArgs = [string];
type AttachTagToArchiveRecord = [string, string];
type DetachTagFromArchiveRecord = [string, string];
type SendSubscriptionArgs = [PushSubscription];
type ValidateEndpointArgs = [string];
type MakeClipArgs = [string, number, number];
type FetchRecentLogsArgs = [number, number];

export class RpcClientPlugin extends RpcClient {
    public AddObservable(uri: string) {
        return this.Call<AddObservableArgs, AddObservableRet>('AddObservable', uri);
    }

    public RemoveObservable(uri: string) {
        return this.Call<RemoveObservableArgs, boolean>('RemoveObservable', uri);
    }

    public ReorderPlugin(oldIndex: number, newIndex: number) {
        return this.Call<ReorderPluginArgs, boolean>('ReorderPlugin', oldIndex, newIndex);
    }

    public EnablePlugin(id: number, enabled: boolean) {
        return this.Call<EnablePluginArgs, boolean>('EnablePlugin', id, enabled);
    }

    public ReorderObservablePlugin(uri: string, oldIndex: number, newIndex: number) {
        return this.Call<ReorderObservablePluginArgs, boolean>('ReorderObservablePlugin', uri, oldIndex, newIndex);
    }

    public StopRecording(label: string) {
        return this.Call<StopRecordingArgs, boolean>('StopRecording', label);
    }

    public RemoveArchiveRecord(filename: string) {
        return this.Call<RemoveArchiveRecordArgs, boolean>('RemoveArchiveRecord', filename);
    }

    public AttachTagToArchiveRecord(filename: string, tag: string) {
        return this.Call<AttachTagToArchiveRecord, boolean>('AttachTagToArchiveRecord', filename, tag);
    }

    public DetachTagFromArchiveRecord(filename: string, tag: string) {
        return this.Call<DetachTagFromArchiveRecord, boolean>('DetachTagFromArchiveRecord', filename, tag);
    }

    public Shutdown() {
        return this.Call('Shutdown');
    }

    public GetVAPID() {
        return this.Call<NoArgs, string | false>('GetVAPID');
    }

    public SendSubscription(subscription: PushSubscription) {
        return this.Call<SendSubscriptionArgs, boolean>('SendSubscription', subscription);
    }

    public ValidateEndpoint(endpoint: string) {
        return this.Call<ValidateEndpointArgs, boolean>('ValidateEndpoint', endpoint);
    }

    public DanglingRecordsSummary() {
        return this.Call<NoArgs, DanglingRecordsSummaryRet>('DanglingRecordsSummary');
    }

    public RemoveDanglingRecords() {
        return this.Call<NoArgs, number>('RemoveDanglingRecords');
    }

    public MakeClip(source: string, begin: number, end: number) {
        return this.Call<MakeClipArgs, boolean>('MakeClip', source, begin, end);
    }

    public FetchRecentLogs(fromTm: number, limit: number) {
        return this.Call<FetchRecentLogsArgs, LogItem[]>('FetchRecentLogs', fromTm, limit);
    }

    public ImproveAccess(passphrace: string) {
        return this.Call<[string], boolean>('ImproveAccess', passphrace);
    }
}
