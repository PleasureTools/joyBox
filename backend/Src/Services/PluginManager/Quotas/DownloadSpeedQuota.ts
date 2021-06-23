import { Event } from '../../../Common/Event';
import { LimitedCache } from '../../../Common/LimitedCache';
import { Logger } from '../../../Common/Logger';
import { LiveStream } from '../../../Plugins/Plugin';
import { PluginManager } from '../../../Services/PluginManager';
import { RecordingProgress, RecordingService } from '../../../Services/RecordingService';
import { Arbiter, Disposable } from '../PluginManagerController';

export class DownloadSpeedQuota implements Arbiter, Disposable {
    public readonly VoteEvent = new Event<void>();
    private quota = 0;
    private decision = true;
    private bitrateCache = new LimitedCache<string, number>(100);
    public constructor(
        private pluginManager: PluginManager,
        private recorder: RecordingService) {
        pluginManager.LiveStreamEvent.On(this.liveStreamFn);
        recorder.ProgressEvent.On(this.recordingProgressFn);
    }
    public Decision() {
        return this.decision;
    }
    public Dispose() {
        this.pluginManager.LiveStreamEvent.Off(this.liveStreamFn);
        this.recorder.ProgressEvent.Off(this.recordingProgressFn);
    }
    public StreamFilter(s: LiveStream) {
        const bitrate = this.bitrateCache.Get(s.url);
        return bitrate === null || bitrate <= this.quota - this.DownloadSpeed();
    }
    public get Quota() { return this.quota; }
    public set Quota(quota: number) {
        if (this.quota !== quota) {
            this.quota = quota;
            this.OnUpdate();
        }
    }
    private liveStreamFn = (s: LiveStream) => this.OnLive(s);
    private recordingProgressFn = (e: RecordingProgress) => this.OnRecordingProgress(e);
    private DownloadSpeed() {
        return this.recorder.Records
            .reduce((speed: number, r: RecordingProgress) => speed + r.bitrate, 0);
    }
    private BestDropRecording() {
        const exceedingQuota = this.DownloadSpeed() - this.quota;

        let bestMatch = this.recorder.Records[0];
        let bestMatchScore = bestMatch.bitrate - exceedingQuota;

        if (bestMatchScore === 0)
            return bestMatch;

        for (const r of this.recorder.Records) {
            const score = r.bitrate - exceedingQuota;
            if (score === 0)
                return r;
            else if (score < 0)
                continue;

            if (score < bestMatchScore) {
                bestMatch = r;
                bestMatchScore = bestMatch.bitrate - exceedingQuota;
            }
        }

        return bestMatch;
    }
    private OnLive(stream: LiveStream) {
        const bitrate = this.bitrateCache.Get(stream.url);
        if (bitrate !== null && bitrate + this.DownloadSpeed() <= this.quota)
            return;

        this.OnUpdate();
    }
    private OnRecordingProgress(e: RecordingProgress) {
        const bitrate = this.bitrateCache.Get(e.label);
        if (bitrate === null || e.bitrate > bitrate) {
            this.bitrateCache.Set(e.label, e.bitrate);
        }

        this.OnUpdate();
    }
    private OnUpdate() {
        const newDecision = this.DownloadSpeed() <= this.quota;

        if (this.decision !== newDecision) {
            this.decision = newDecision;
            this.VoteEvent.Emit();
        }

        if (newDecision === false) {
            Logger.Get.Log('Plugin manager has been stopped due download speed quota');
            this.recorder.StopRecording(this.BestDropRecording().label);
        }
    }
}
