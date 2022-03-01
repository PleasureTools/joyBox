import { of, from, merge } from 'rxjs';
import { concatMap, filter, delay } from 'rxjs/operators';

import { AppFacade } from '@/AppFacade';
import { RecurringTask } from '@/Common/RecurringTask';
import { Logger } from './../../Common/Logger';
import { ObservableStream } from '@/Common/Types';

export class Service extends RecurringTask {
  private readonly REQUEST_INTERVAL = 5000;
  public constructor(private readonly TASK_INTERVAL: number, private api: AppFacade) {
    super(TASK_INTERVAL);
  }

  public async Task(): Promise<void> {
    from(this.api.Observables.values())
      .pipe(
        delay(this.REQUEST_INTERVAL),
        concatMap(async (x: ObservableStream) => ({ observable: x, valid: await this.api.PlaylistExtractor.Extract(x.url) !== null })))
      .subscribe(x => {
        if (x.valid !== x.observable.valid) {
          x.observable.valid = x.valid;

          this.api.Storage.UpdateValidity(x.observable.url, x.observable.valid);
          this.api.Broadcaster.UpdateObservableValidity(x.observable.url, x.observable.valid);
        }
      });
  }

  public OnAbort(e: Error): void {
    Logger.Get.Log('ObservableValidatorService::Stop() with ' + e);
  }
}
