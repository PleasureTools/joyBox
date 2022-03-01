<template>
  <div
    ref="container"
    class="player-container"
    tabindex="0"
    @keydown.left="FastBackwardKb"
    @keydown.right="FastForwardKb"
    @keydown.space="TogglePlay"
    @touchmove="TouchMove"
    @touchstart="TouchStart"
    @touchend="TouchEnd"
    v-stream:keydown="userInteract"
    v-stream:mousemove="userInteract"
    v-stream:click="userInteract"
    v-touch="{ left: EmitInteractEvent, right: EmitInteractEvent }">
    <video
      ref="video"
      :src="src"
      @click="TogglePlay"
      @timeupdate="TimeUpdate"
      @durationchange="DurationChange"
      @play="Play"
      @pause="Pause"
      @abort="Abort"
      v-stream:waiting="playerWaiting"
      v-stream:canplay="playerCanplay"
      v-touch="{ left: FastBackward, right: FastForward }"
      preload="metadata"
      controlslist="nodownload">
      No fap
    </video>
    <div v-visible="showControls" class="controls">
      <div ref="seek" class="seek-container" @click="Seek">
        <div class="seek-progress-mount">
          <div class="seek-progress" :style="{ width: seekProgressWidth + 'px' }"></div>
          <div class="seek-progress-head"></div>
        </div>
      </div>
      <div class="d-flex">
        <v-btn icon @click="TogglePlay">
          <v-icon v-if="isPlaying" color="#e5e5e5">mdi-pause</v-icon>
          <v-icon v-else color="#e5e5e5">mdi-play</v-icon>
        </v-btn>
        <div class="time">
          <span>{{ DurationFormat(currentTime) }}</span> /
          <span>{{ DurationFormat(Duration) }}</span>
        </div>
        <slot>
          <v-spacer />
        </slot>
        <v-btn icon @click="ToggleFullscreen">
          <v-icon color="#e5e5e5">fullscreen</v-icon>
        </v-btn>
      </div>
    </div>
    <v-progress-circular
      v-if="waitingData"
      size="100"
      indeterminate
      color="primary"
      class="loading-status">
    </v-progress-circular>
    <div v-if="IsRewindPredictionShown" class="rewind-predictor-wrapper">
      <div class="rewind-predictor">{{ PredictedRewindStr }}</div>
    </div>
  </div>
</template>

<style scoped>
video {
  width: 100%;
  height: 100%;
}
.player-container {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: black;
}
.player-container:focus {
  outline: none;
}
.controls {
  position: absolute;
  width: 100%;
  bottom: 0;
  z-index: 1;
}
.seek-container {
  display: flex;
  flex-direction: column-reverse;
  height: 16px;
  cursor: pointer;
}
.seek-progress-mount {
  display: flex;
  height: 3px;
  background-color: #4c4c51;
}
.seek-progress {
  height: 3px;
  background-color: #ff0100;
}
.seek-progress-head {
  position: relative;
  display: inline-block;
  height: 7px;
  width: 7px;
  left: -1px;
  top: -2px;
  border-radius: 50%;
  background-color: #ff0100;
  pointer-events: none;
}
.time {
  padding-top: 7px;
  color: #e5e5e5;
  text-shadow: 1px 1px 1px black;
}
.loading-status {
  position: absolute;
  left: 50%;
  top: 50%;
  margin-left: -50px;
  margin-top: -50px;
}

.rewind-predictor-wrapper {
  position: absolute;
  left: 0;
  right: 0;
  top: 10px;
  display: flex;
  justify-content: center;
}

.rewind-predictor {
  color: #e5e5e5;
  text-shadow: 1px 1px 1px black;
  font-size: 2em;;
  font-weight: bolder;
}
</style>

<script lang="ts">
import 'reflect-metadata';

import fd from 'format-duration';
import { interval, Subject, Subscription } from 'rxjs';
import { map, merge, sampleTime, throttle } from 'rxjs/operators';
import {
  Component,
  Emit,
  Mixins,
  Prop,
  Ref
} from 'vue-property-decorator';

import { visible } from '@/Directives';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { TouchWrapper } from '@/types';
import { Clamp } from '@Shared/Util';

type second = number;

export enum BehaivorAction { Play, Stop, Nope }

interface CurrentTimeResult {
  action: BehaivorAction; // invoke action
  currentTime: second; // -1 means do not override position
  currentTimeUI: second;
}

interface OverriddenBehavior {
  /**
   * Sets the function to recalculate the playback position.
   * Calls when interacting with seek bar
   * Affects the playback position
   *
   * @param seek position 0-1.0
   * @return new playback position in seconds
   */
  Seek: (seek: number) => second;
  /**
   * Control playback behavior. Invoked when current play time changed
   *
   * @param pos time in space of the current segment in seconds
   * @return player behaiver
   */
  CurrentTime: (pos: second) => CurrentTimeResult;
  /**
   * Overrides the displayed duration
   */
  durationUI: second;
}

interface RewindStep {
  step: second;
  threshold: number;
}

@Component({
  directives: {
    visible
  }
})
export default class VideoPlayer extends Mixins(RefsForwarding) {
  @Prop({ required: true }) private readonly src!: string;
  @Prop() private readonly behaiverOverride?: OverriddenBehavior;
  @Prop({ required: false, default: false }) private readonly autoplay!: boolean;

  @Ref() private readonly container!: HTMLElement;
  @Ref() private readonly video!: HTMLVideoElement;
  @Ref() private readonly seek!: HTMLElement;

  private seekProgressWidth = 0;

  private currentTime = 0;
  private duration = 0;

  private isPlaying = false;

  private showControls = true;
  private hideControlsTimer: number | null = null;
  private readonly CONTROLS_HIDE_DELAY = 4000;
  private readonly NEAR_REWIND_STEP = 5;
  private readonly FAR_REWIND_STEP = 150;
  private readonly REWIND_LENGTH_THRESHOLD = 150;
  private readonly rewindStepMap: RewindStep[] = [
    { step: 150, threshold: 150 }, // shift +
    { step: 5, threshold: 50 }, // default
    { step: 1 / 60, threshold: 0 }]; // ctrl +

  private userInteract = new Subject();
  private playerWaiting = new Subject();
  private playerCanplay = new Subject();
  private waitingData = false;
  private userInteractUnsub!: Subscription;
  private playerWaitingUnsub!: Subscription;

  private readonly untouched = -1;
  private touchStart = this.untouched;
  private touchMove = this.untouched;

  public mounted(): void {
    this.userInteractUnsub = this.userInteract
      .pipe(throttle(() => interval(this.CONTROLS_HIDE_DELAY / 2)))
      .subscribe(() => this.AutohideControls());

    this.playerWaitingUnsub = this.playerWaiting
      .pipe(map((x) => true))
      .pipe(merge(this.playerCanplay.pipe(map((x) => false))))
      .pipe(sampleTime(250))
      .subscribe((x) => (this.waitingData = x));

    this.AutohideControls();

    if (this.autoplay) {
      this.video.play();
    }
  }

  public destroyed(): void {
    this.userInteractUnsub.unsubscribe();
    this.playerWaitingUnsub.unsubscribe();

    if (this.hideControlsTimer) {
      clearTimeout(this.hideControlsTimer);
    }
  }

  @Emit() private timeupdate(time: number) {}
  private ToggleFullscreen() {
    const o = 'landscape-primary';

    if (document.fullscreenElement === this.container) {
      document.exitFullscreen();
    } else {
      this.container.requestFullscreen();
      screen.orientation.type !== o && screen.orientation.lock(o);
    }
  }

  private EmitInteractEvent() {
    this.userInteract.next();
  }

  private TogglePlay() {
    this.isPlaying ? this.video.pause() : this.video.play();
    this.isPlaying = !this.isPlaying;
  }

  private async Seek(e: MouseEvent) {
    const isPlaying = this.isPlaying;

    this.seekProgressWidth = e.offsetX;

    const videoCurrentTime = this.behaiverOverride ?
      this.behaiverOverride.Seek(e.offsetX / this.seek.clientWidth) :
      (e.offsetX / this.seek.clientWidth) * this.video.duration;

    await this.$nextTick();

    this.video.currentTime = videoCurrentTime;
    isPlaying ? this.video.play() : this.video.pause();
  }

  private async TimeUpdate(e: Event) {
    if (!this.video) return;

    if (this.behaiverOverride) {
      const behaiver = this.behaiverOverride.CurrentTime(this.video.currentTime);

      this.currentTime = behaiver.currentTimeUI;

      await this.$nextTick();

      if (behaiver.currentTime !== -1) {
        this.video.currentTime = behaiver.currentTime;
      }

      if (behaiver.action === BehaivorAction.Play) {
        this.video.play();
      } else if (behaiver.action === BehaivorAction.Stop) {
        this.video.pause();
      }
    } else {
      this.currentTime = this.video.currentTime;
    }

    this.seekProgressWidth = this.currentTime / this.Duration * this.seek.clientWidth;

    this.timeupdate(this.currentTime);
  }

  private get Duration() {
    return this.behaiverOverride ? this.behaiverOverride.durationUI : this.duration;
  }

  private DurationChange(e: Event) {
    this.duration = this.video.duration;
  }

  private Play(e: Event) {
    if (!this.isPlaying) this.isPlaying = true;
  }

  private Pause(e: Event) {
    this.isPlaying = false;
  }

  private Abort() {
    this.isPlaying = false;
  }

  private FastBackward(e: TouchWrapper) {
    if (this.behaiverOverride) {
      const offsetX = Clamp(this.currentTime - this.CalculateRewindStep(e), 0, this.Duration) /
                      this.Duration * this.seek.clientWidth;

      this.Seek({ offsetX } as MouseEvent);
    } else {
      this.video.currentTime -= this.CalculateRewindStep(e);
    }
  }

  private FastForward(e: TouchWrapper) {
    if (this.behaiverOverride) {
      const offsetX = Clamp(this.currentTime + this.CalculateRewindStep(e), 0, this.Duration) /
                      this.Duration * this.seek.clientWidth;

      this.Seek({ offsetX } as MouseEvent);
    } else {
      this.video.currentTime += this.CalculateRewindStep(e);
    }
  }

  private ThresholdFromEvent(e: KeyboardEvent) {
    return (e.ctrlKey ? this.rewindStepMap[2] :
      e.shiftKey ? this.rewindStepMap[0] : this.rewindStepMap[1]).threshold;
  }

  private FastBackwardKb(e: KeyboardEvent) {
    this.FastBackward({
      touchstartX: 0,
      touchstartY: 0,
      touchmoveX: 0,
      touchmoveY: 0,
      touchendX: this.ThresholdFromEvent(e) + 1,
      touchendY: 0,
      offsetX: 0,
      offsetY: 0
    });
  }

  private FastForwardKb(e: KeyboardEvent) {
    this.FastForward({
      touchstartX: 0,
      touchstartY: 0,
      touchmoveX: 0,
      touchmoveY: 0,
      touchendX: this.ThresholdFromEvent(e) + 1,
      touchendY: 0,
      offsetX: 0,
      offsetY: 0
    });
  }

  private DurationFormat(duration: number) {
    return fd(duration * 1000);
  }

  private AutohideControls() {
    this.showControls = true;
    if (this.hideControlsTimer) {
      clearTimeout(this.hideControlsTimer);
      this.hideControlsTimer = null;
    }

    this.hideControlsTimer = setTimeout(() => {
      this.showControls = false;
      this.container.focus();
    }, this.CONTROLS_HIDE_DELAY);
  }

  private CalculateRewindStep(e: TouchWrapper) {
    const distance = Math.abs(e.touchstartX - e.touchendX);
    return this.rewindStepMap.find(x => distance > x.threshold)?.step ?? 0;
  }

  private TouchStart(e: TouchEvent) {
    this.touchStart = e.changedTouches[0].clientX;
    this.touchMove = this.touchStart;
  }

  private TouchMove(e: TouchEvent) {
    this.touchMove = e.changedTouches[0].clientX;
  }

  private TouchEnd(e: TouchEvent) {
    this.touchStart = this.untouched;
    this.touchMove = this.untouched;
  }

  private get PredictedRewind() {
    return this.CalculateRewindStep({
      touchstartX: this.touchStart,
      touchstartY: 0,
      touchmoveX: 0,
      touchmoveY: 0,
      touchendX: this.touchMove,
      touchendY: 0,
      offsetX: 0,
      offsetY: 0
    });
  }

  private get PredictedRewindStr() {
    const step = this.PredictedRewind;

    return step < 1 ? '1 frame' : `${step}s`;
  }

  private get IsRewindPredictionShown() {
    return this.PredictedRewind > 0;
  }
}
</script>
