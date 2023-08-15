import * as Path from 'path';

import { AppFacade } from './AppFacade';
import { GenFilename, Timestamp } from './Common/Util';
import { INCOMPLETE_FOLDER } from './Constants';
import { LiveStream } from './Plugins/Plugin';

export type Interceptor = (e: LiveStream) => boolean;
export class PluginManagerListener {
  private interceptorList = new Set<Interceptor>();
  public constructor(private app: AppFacade) {
    this.app.PluginManager.LiveStreamEvent.On(e => this.InterceptStage(e));
  }

  public AddInterceptor(fn: Interceptor): void {
    this.interceptorList.add(fn);
  }

  public RemoveInterceptor(fn: Interceptor): void {
    this.interceptorList.delete(fn);
  }

  private Onlive(e: LiveStream) {
    this.app.Recorder.StartRecording(e.url, e.streamUrl, Path.join(INCOMPLETE_FOLDER, GenFilename(e.url)));
    this.app.LinkedStreams.Remove(e.url);
    this.UpdateLastSeen(e.url);
    this.app.Broadcaster.NewRecording({ label: e.url, streamUrl: e.streamUrl });
  }

  private InterceptStage(e: LiveStream) {
    if ([...this.interceptorList.values()].every(x => x(e))) { this.Onlive(e); }
  }

  private UpdateLastSeen(url: string) {
    const now = Timestamp();
    const target = this.app.Observables.get(url);
    if (!target) return;
    target.lastSeen = now;
    this.app.Storage.UpdateLastSeen(url, now);
    this.app.Broadcaster.UpdateLastSeen({ url, lastSeen: now });
  }
}
