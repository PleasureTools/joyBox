<template>
  <div
    ref="container"
    class="player-container"
    tabindex="0"
    @keydown.left="FastBackward"
    @keydown.right="FastForward"
    @keydown.space="TogglePlay"
    v-stream:keydown="userInteract"
    v-stream:mousemove="userInteract"
    v-stream:click="userInteract"
    v-touch="{ left: EmitInteractEvent, right: EmitInteractEvent }"
  >
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
      controlslist="nodownload"
    >No fap</video>
    <div v-visible="showControls" class="controls">
      <div ref="seek" class="seek-container" @click="Seek">
        <div class="seek-progress-mount">
          <div class="seek-progress" :style="{width: seekProgressWidth + 'px'}"></div>
          <div class="seek-progress-head"></div>
        </div>
      </div>
      <div class="d-flex">
        <v-btn icon @click="TogglePlay">
          <v-icon v-if="isPlaying" color="#e5e5e5">mdi-pause</v-icon>
          <v-icon v-else color="#e5e5e5">mdi-play</v-icon>
        </v-btn>
        <div class="time">
          <span>{{ Duration(currentTime) }}</span> /
          <span>{{ Duration(duration) }}</span>
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
      class="loading-status"
    ></v-progress-circular>
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
}
.loading-status {
  position: absolute;
  left: 50%;
  top: 50%;
  margin-left: -50px;
  margin-top: -50px;
}
</style>

<script lang="ts">
import 'reflect-metadata';

import fd from 'format-duration';
import { interval, Subject, Subscription } from 'rxjs';
import { map, merge, sampleTime, throttle } from 'rxjs/operators';
import { Component, Emit, Mixins, Prop, Ref, Vue } from 'vue-property-decorator';

import { visible } from '@/Directives';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { TouchWrapper } from '@/types';

@Component({
  directives: {
    visible
  }
})
export default class VideoPlayer extends Mixins(RefsForwarding) {
  @Prop({ required: true }) private readonly src!: string;

  @Ref() private readonly container!: HTMLElement;
  @Ref() private readonly video!: HTMLVideoElement;
  @Ref() private readonly seek!: HTMLElement;

  private seekProgressWidth: number = 0;

  private currentTime: number = 0;
  private duration: number = 0;

  private isPlaying = false;

  private showControls = true;
  private hideControlsTimer: number | null = null;
  private readonly CONTROLS_HIDE_DELAY = 4000;
  private readonly NEAR_REWIND_STEP = 5;
  private readonly FAR_REWIND_STEP = 150;
  private userInteract = new Subject();
  private playerWaiting = new Subject();
  private playerCanplay = new Subject();
  private waitingData = false;
  private userInteractUnsub!: Subscription;
  private playerWaitingUnsub!: Subscription;
  public mounted() {
    this.userInteractUnsub = this.userInteract
      .pipe(throttle(() => interval(this.CONTROLS_HIDE_DELAY / 2)))
      .subscribe(() => this.AutohideControls());

    this.playerWaitingUnsub = this.playerWaiting
      .pipe(map(x => true))
      .pipe(merge(this.playerCanplay.pipe(map(x => false))))
      .pipe(sampleTime(250))
      .subscribe(x => this.waitingData = x);

    this.AutohideControls();
  }
  public destroyed() {
    this.userInteractUnsub.unsubscribe();
    this.playerWaitingUnsub.unsubscribe();
  }
  @Emit() private timeupdate(time: number) { }
  private ToggleFullscreen() {
    const o = 'landscape-primary';
    document.fullscreenElement === this.container ?
      document.exitFullscreen() :
      this.container.requestFullscreen(), screen.orientation.type !== o && screen.orientation.lock(o);
  }
  private EmitInteractEvent() {
    this.userInteract.next();
  }
  private TogglePlay() {
    this.isPlaying ? this.video.pause() : this.video.play();
    this.isPlaying = !this.isPlaying;
  }
  private Seek(e: MouseEvent) {
    this.seekProgressWidth = e.offsetX;
    this.video.currentTime = e.offsetX / this.seek.clientWidth * this.video.duration;
  }
  private TimeUpdate(e: Event) {
    if (!this.video)
      return;

    this.currentTime = this.video.currentTime;
    this.seekProgressWidth = this.video.currentTime / this.video.duration * this.seek.clientWidth;

    this.timeupdate(this.currentTime);
  }
  private DurationChange(e: Event) {
    this.duration = this.video.duration;
  }
  private Play(e: Event) {
    if (!this.isPlaying)
      this.isPlaying = true;
  }
  private Pause(e: Event) {
    this.isPlaying = false;
  }
  private Abort() {
    this.isPlaying = false;
  }
  private FastBackward(e: TouchWrapper) {
    this.video.currentTime -= this.CalculateRewindStep(e);
  }
  private FastForward(e: TouchWrapper) {
    this.video.currentTime += this.CalculateRewindStep(e);
  }
  private Duration(duration: number) {
    return fd(duration * 1000);
  }
  private AutohideControls() {
    this.showControls = true;
    if (this.hideControlsTimer) {
      clearTimeout(this.hideControlsTimer);
      this.hideControlsTimer = null;
    }

    this.hideControlsTimer = setTimeout(() => this.showControls = false, this.CONTROLS_HIDE_DELAY);
  }
  private CalculateRewindStep(e: TouchWrapper) {
    return Math.abs(e.touchstartX - e.touchendX) < 150 ?
      this.NEAR_REWIND_STEP :
      this.FAR_REWIND_STEP;
  }
}
</script>