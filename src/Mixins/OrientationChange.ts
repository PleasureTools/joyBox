import { fromEvent, interval, Subject, Subscription } from 'rxjs';
import { throttle } from 'rxjs/operators';
import { Component, Emit, Vue } from 'vue-property-decorator';

import { IsPortrait } from '../Common/IsPortrait';

export enum Orientation { Portrait, Landscape}

@Component
export default class OrientationChange extends Vue {
  private unsub!: Subscription;

  public OrientationChange(e: Orientation): void { }

  public mounted(): void {
    this.unsub = fromEvent(window, 'resize')
      .pipe(throttle(() => interval(100)))
      .subscribe(e => this.OrientationChange(this.Orientation()));

    this.OrientationChange(this.Orientation());
  }

  public destroyed(): void {
    this.unsub.unsubscribe();
  }

  private Orientation() {
    return IsPortrait() ? Orientation.Portrait : Orientation.Landscape;
  }
}
