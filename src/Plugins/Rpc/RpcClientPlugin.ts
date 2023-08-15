import { LogItem, NotificationType, Playlist } from '@Shared/Types';
import { RpcClient } from '../../Common';
import { UntrackedVideo } from '../../types';

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
type SendSubscriptionArgs = [PushSubscription, NotificationType];
type ValidateEndpointArgs = [string];
type RetrieveNotificationsArgs = [string];
type AddNotificationArgs = [string, NotificationType];
type RemoveNotification = [string, NotificationType];
type MakeClipArgs = [string, number, number, boolean];
type FetchRecentLogsArgs = [number, number];
type AddFilterArgs = [string, string];
type RemoveFilterArgs = [number];
type LinkVideoArgs = [string, string, string, string];

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

  public AddArchiveFilter(name: string, query: string) {
    return this.Call<AddFilterArgs, boolean>('AddArchiveFilter', name, query);
  }

  public RemoveArchiveFilter(id: number) {
    return this.Call<RemoveFilterArgs, boolean>('RemoveArchiveFilter', id);
  }

  public AddObservablesFilter(name: string, query: string) {
    return this.Call<AddFilterArgs, boolean>('AddObservablesFilter', name, query);
  }

  public RemoveObservablesFilter(id: number) {
    return this.Call<RemoveFilterArgs, boolean>('RemoveObservablesFilter', id);
  }

  public Shutdown() {
    return this.Call('Shutdown');
  }

  public GetVAPID() {
    return this.Call<NoArgs, string | false>('GetVAPID');
  }

  public SendSubscription(subscription: PushSubscription, notification: NotificationType): Promise<boolean> {
    return this.Call<SendSubscriptionArgs, boolean>('SendSubscription', subscription, notification);
  }

  public ValidateEndpoint(endpoint: string) {
    return this.Call<ValidateEndpointArgs, boolean>('ValidateEndpoint', endpoint);
  }

  public RetrieveNotifications(endpoint: string) {
    return this.Call<RetrieveNotificationsArgs, NotificationType[]>('RetrieveNotifications', endpoint);
  }

  public AddNotification(endpoint: string, notification: NotificationType) {
    return this.Call<AddNotificationArgs, boolean>('AddNotification', endpoint, notification);
  }

  public RemoveNotification(endpoint: string, notification: NotificationType) {
    return this.Call<RemoveNotification, void>('RemoveNotification', endpoint, notification);
  }

  public DanglingRecordsSummary() {
    return this.Call<NoArgs, DanglingRecordsSummaryRet>('DanglingRecordsSummary');
  }

  public RemoveDanglingRecords() {
    return this.Call<NoArgs, number>('RemoveDanglingRecords');
  }

  public FindUntrackedVideos() {
    return this.Call<NoArgs, UntrackedVideo[]>('FindUntrackedVideos');
  }

  public LinkVideo(filename: string, title: string, source: string, newFilename: string) {
    return this.Call<LinkVideoArgs, boolean>('LinkVideo', filename, title, source, newFilename);
  }

  public MakeClip(source: string, begin: number, end: number, reencode: boolean) {
    return this.Call<MakeClipArgs, boolean>('MakeClip', source, begin, end, reencode);
  }

  public FetchRecentLogs(fromTm: number, limit: number) {
    return this.Call<FetchRecentLogsArgs, LogItem[]>('FetchRecentLogs', fromTm, limit);
  }

  public GenerateAccessToken(passphrace: string) {
    return this.Call<[string], string>('GenerateAccessToken', passphrace);
  }

  public UpgradeAccess(token: string) {
    return this.Call<[string], boolean>('UpgradeAccess', token);
  }

  public SetStorageQuota(quota: number) {
    return this.Call<[number], boolean>('SetStorageQuota', quota);
  }

  public SetInstanceQuota(quota: number) {
    return this.Call<[number], boolean>('SetInstanceQuota', quota);
  }

  public SetDownloadSpeedQuota(quota: number) {
    return this.Call<[number], boolean>('SetDownloadSpeedQuota', quota);
  }

  public SetRemoteSeleniumUrl(url: string) {
    return this.Call<[string], boolean>('SetRemoteSeleniumUrl', url);
  }

  public CreatePlaylist(playlist: Playlist): Promise<boolean> {
    return this.Call<[Playlist], boolean>('CreatePlaylist', playlist);
  }

  public RemovePlaylist(id: number): Promise<boolean> {
    return this.Call<[number], boolean>('RemovePlaylist', id);
  }
}
