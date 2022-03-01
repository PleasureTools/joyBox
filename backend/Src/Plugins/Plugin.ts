import { Event, Observable } from '../Common/Event';
import { RecurringTask } from '../Common/RecurringTask';
import { ExecutionFence } from '../Common/ExecutionFence';

export interface LiveStream {
  url: string;
  streamUrl: string;
}

export interface StreamExtractor {
  CanParse(uri: string): boolean;
  // Returns ffmpeg-ready stream url
  Extract(uri: string): Promise<string | null>;
}

export type OnLiveCb = (info: LiveStream) => void;

export abstract class LocatorService extends RecurringTask {
  protected observables: Set<string> = new Set();
  private liveStreamEvent: Event<LiveStream> = new Event();
  protected pauseFence = new ExecutionFence();
  constructor(protected extractor: StreamExtractor, updatePeriod: number) { super(updatePeriod); }
  public get LiveStreamEvent(): Observable<LiveStream> {
    return this.liveStreamEvent;
  }

  public SetObservables(observables: Set<string>): void {
    this.observables = observables;
  }

  public CanParse(uri: string): boolean {
    return this.extractor.CanParse(uri);
  }

  public Pause(): void {
    this.pauseFence.Pause();
  }

  public Resume(): void {
    this.pauseFence.Resume();
  }

  /**
     *  Notify listeners about onlive stream
     */
  protected Notify(info: LiveStream): void {
    this.liveStreamEvent.Emit(info);
  }
}
