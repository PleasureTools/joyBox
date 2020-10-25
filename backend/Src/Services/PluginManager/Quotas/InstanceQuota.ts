import { Event } from '@/Common/Event';
import { LiveStream } from '@/Plugins/Plugin';
import { PluginManager } from '@/Services/PluginManager';
import { CompleteInfo, RecordingService } from '@/Services/RecordingService';
import { Arbiter, Disposable } from '../PluginManagerController';

export class InstanceQuota implements Arbiter, Disposable {
    public readonly VoteEvent = new Event<void>();
    private quota = 0;
    private decision = true;
    public constructor(
        private pluginManager: PluginManager,
        private recorder: RecordingService) {
        this.pluginManager.LiveStreamEvent.On(this.liveStreamFn);
        this.recorder.CompleteEvent.On(this.finishRecordingFn);
    }
    public Dispose() {
        this.pluginManager.LiveStreamEvent.Off(this.liveStreamFn);
    }
    public get Quota() { return this.quota; }
    public set Quota(quota: number) {
        if (this.quota !== quota) {
            this.quota = quota;
            this.OnUpdate();
        }
    }
    public Decision() {
        return this.decision;
    }
    private OnLive(stream: LiveStream) {
        this.OnUpdate();
    }
    private FinisgRecording(e: CompleteInfo) {
        this.OnUpdate();
    }
    private liveStreamFn = (s: LiveStream) => this.OnLive(s);
    private finishRecordingFn = (e: CompleteInfo) => this.FinisgRecording(e);
    private OnUpdate() {
        const newDecision = this.recorder.Records.length <= this.quota;

        if (this.decision !== newDecision) {
            this.decision = newDecision;
            this.VoteEvent.Emit();
        }

        if (this.decision === false && this.quota < this.recorder.Records.length) {
            this.recorder.Records
                .slice(this.quota - this.recorder.Records.length)
                .forEach(x => this.recorder.StopRecording(x.label));
        }
    }
}
