import * as Path from 'path';

import { AppFacade } from './AppFacade';
import { GenFilename, Timestamp } from './Common/Util';
import { ARCHIVE_FOLDER } from './Constants';
import { LiveStream } from './Plugins/Plugin';

export class PluginManagerListener {
    public constructor(private app: AppFacade) {
        this.app.PluginManager.LiveStreamEvent.On(e => this.Onlive(e));
    }
    private Onlive(e: LiveStream) {
        this.app.Recorder.StartRecording(e.url, e.streamUrl, Path.join(ARCHIVE_FOLDER, GenFilename(e.url)));
        this.app.LinkedStreams.Remove(e.url);
        this.UpdateLastSeen(e.url);
        this.app.Broadcaster.NewRecording(e.url);
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
