<template>
  <div
    ref="container"
    class="player-container"
    tabindex="0"
    @keydown.left="FastBackward"
    @keydown.right="FastForward"
  >
    <video
      ref="video"
      :src="src"
      @click="TogglePlay"
      @timeupdate="TimeUpdate"
      @durationchange="DurationChange"
      @pause="Pause"
      @abort="Abort"
      v-touch="{ left: FastBackward, right: FastForward }"
      preload="metadata"
      controlslist="nodownload"
    >No fap</video>
    <div class="controls">
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
  top: -2px;
  border-radius: 50%;
  background-color: #ff0100;
  pointer-events: none;
}
.time {
  padding-top: 7px;
  color: #e5e5e5;
}
</style>

<script lang="ts">
import 'reflect-metadata';

import fd from 'format-duration';
import { Component, Emit, Mixins, Prop, Ref, Vue } from 'vue-property-decorator';

import RefsForwarding from '@/Mixins/RefsForwarding';

@Component
export default class VideoPlayer extends Mixins(RefsForwarding) {
  @Prop({ required: true }) private readonly src!: string;

  @Ref() private readonly container!: HTMLElement;
  @Ref() private readonly video!: HTMLVideoElement;
  @Ref() private readonly seek!: HTMLElement;

  private readonly jumpStep = 10;
  private seekProgressWidth: number = 0;

  private currentTime: number = 0;
  private duration: number = 0;

  private isPlaying = false;

  @Emit() private timeupdate(time: number) { }

  private ToggleFullscreen() {
    document.fullscreenElement === this.container ?
      document.exitFullscreen() :
      this.container.requestFullscreen(), screen.orientation.lock('landscape-primary');
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
  private Pause(e: Event) {
    this.isPlaying = false;
  }
  private Abort() {
    this.isPlaying = false;
  }
  private FastBackward() {
    this.video.currentTime -= this.jumpStep;
  }
  private FastForward() {
    this.video.currentTime += this.jumpStep;
  }
  private Duration(duration: number) {
    return fd(duration * 1000);
  }
  private get Filename() {
    const splitted = this.src.split('/');
    return splitted[splitted.length - 1];
  }
}
</script>