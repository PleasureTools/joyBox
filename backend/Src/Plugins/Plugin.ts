import { Event, Observable } from '../Common/Event';

export interface LiveStream {
    url: string;
    streamUrl: string;
}

export interface StreamExtractor {
    CanParse(uri: string): boolean;
    // Returns ffmpeg-ready stream url
    Extract(uri: string): Promise<string>;
}

export type OnLiveCb = (info: LiveStream) => void;

export abstract class LocatorService {
    protected observables: Set<string> = new Set();
    private liveStreamEvent: Event<LiveStream> = new Event();

    constructor(protected extractor: StreamExtractor) { }

    public get LiveStreamEvent(): Observable<LiveStream> {
        return this.liveStreamEvent;
    }

    public abstract Start(): void;
    public abstract Stop(): void;

    public SetObservables(observables: Set<string>) {
        this.observables = observables;
    }

    public CanParse(uri: string): boolean {
        return this.extractor.CanParse(uri);
    }

    /**
     *  Notify listeners about onlive stream
     */
    protected Notify(info: LiveStream) {
        this.liveStreamEvent.Emit(info);
    }
}
