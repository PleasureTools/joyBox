import { Logger } from '@/Common/Logger';
import { RecurringTask } from '@/Common/RecurringTask';
import { GetFolderSize } from '@/Common/Util';
import { RecordingService } from './RecordingService';
import { ARCHIVE_FOLDER } from './../Constants';
import { NotificationCenter } from './NotificationCenter';
import { NotificationType } from '@Shared/Types';

export class SizeQuotaNotifier extends RecurringTask {
  private quota = 0;
  private notificationCenter: NotificationCenter | null = null;
  private cachedSize = 0;
  public constructor(private recorder: RecordingService, period = 300000) { super(period); }

  public set NotificationCenter(notificationCenter: NotificationCenter) { this.notificationCenter = notificationCenter; }

  public async Task(): Promise<void> {
    const timeToFill = 10 * 60;
    const size = await GetFolderSize(ARCHIVE_FOLDER);
    const downloadSpeed = this.recorder.Records.reduce((acc, x) => acc + x.bitrate, 0);

    if (downloadSpeed * timeToFill >= this.quota - size && this.cachedSize !== size) {
      this.Notify();
    }
    this.cachedSize = size;
  }

  public OnAbort(e: Error): void {
    Logger.Get.Log('SizeQuotaNotifier::Stop() with ' + e);
  }

  public async Start(): Promise<void> {
    const status = this.IsRunning;
    await super.Start();
    if (status !== this.IsRunning) {
      Logger.Get.Log('SizeQuotaNotifier::Start()');
    }
  }

  public async Stop(): Promise<void> {
    await super.Stop();
    if (!this.IsRunning) {
      Logger.Get.Log('SizeQuotaNotifier::Stop()');
    }
  }

  public UpdateQuota(quota: number): void {
    this.quota = quota;
    this.Task();
  }

  private Notify() {
    this.notificationCenter?.NotifyAllByType({
      title: 'The free space is almost out',
      data: { url: '/archive' }
    }, NotificationType.SizeQuota);
  }
}
