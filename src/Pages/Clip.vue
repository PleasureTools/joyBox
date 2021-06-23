<template>
  <VideoPlayer class="fill-height" :src="Source" @timeupdate="TimeUpdate">
    <SegmentedColorLine class="clip-selection" :height="3" :color-map="ClipSelection" />
    <v-spacer></v-spacer>
    <LongPressButton
      @longpress="MakeClip"
      @update="OnHoldMakeClipBtn"
      @cancel="MakeClipCancel"
      :disabled="ClipBtnDisabled"
      :holdTime="500"
      :steps="10"
    >
      <span id="tooltip-handler" />
      <transition name="fade" mode="out-in">
        <v-icon color="#e5e5e5" :key="newClipScheduled">{{ MakeClipBtnIcon }}</v-icon>
      </transition>
    </LongPressButton>
    <v-tooltip v-model="SaveBtnReady" attach="#tooltip-handler">
      <span>Release to save</span>
    </v-tooltip>
    <v-btn icon @click="BeginAtCurrentTime">
      <v-icon color="#e5e5e5">mdi-alpha-b-circle</v-icon>
    </v-btn>
    <v-btn icon @click="EndAtCurrentTime">
      <v-icon color="#e5e5e5">mdi-alpha-e-circle</v-icon>
    </v-btn>
    <div class="clip-duration">{{ ClipDuration }}</div>
  </VideoPlayer>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease-in 0.1s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
#tooltip-handler {
  position: relative;
  left: -70px;
  top: -70px;
}
.clip-duration {
  padding-top: 7px;
  color: #e5e5e5;
  text-shadow: 1px 1px 1px black;
}
.clip-selection {
  position: absolute;
  top: 13px;
  pointer-events: none;
}
.fill-height {
  height: 100vh;
}
</style>

<script lang="ts">
import fd from 'format-duration';
import { Component, Mixins, Ref, Vue } from 'vue-property-decorator';

import LongPressButton from '@/Components/LongPressButton.vue';
import SegmentedColorLine from '@/Components/SegmentedColorLine.vue';
import VideoPlayer from '@/Components/VideoPlayer.vue';
import RefsForwarding from '@/Mixins/RefsForwarding';

@Component({
  components: {
    SegmentedColorLine,
    LongPressButton,
    VideoPlayer
  }
})
export default class Clip extends Mixins(RefsForwarding) {
  private begin: number = 0;
  private end: number = 0;
  private currentTime: number = 0;
  private saveLongPressProgress = 0;
  private newClipScheduled = false;
  private resetMakeClipBtnIconTimer: number | null = null;
  private readonly MAKE_CLIP_BTN_RESET_DELAY = 3000;
  public created() {
    this.end = this.Duration;
  }
  public beforeDestroy() {
    if (this.resetMakeClipBtnIconTimer)
      clearTimeout(this.resetMakeClipBtnIconTimer);
  }
  private get Record() {
    return this.App.archive.find(x => x.filename === this.$route.params.filename);
  }
  private get Source() {
    return `${this.Env.Origin}/archive/${this.$route.params.filename}`;
  }
  private get Duration() {
    return this.Record ? this.Record.duration : 0;
  }
  private get ClipDuration() {
    return fd((this.end - this.begin) * 1000);
  }
  private get SaveBtnReady() { return this.saveLongPressProgress === 100; }
  private BeginAtCurrentTime() {
    this.begin = this.currentTime;
  }
  private EndAtCurrentTime() {
    this.end = this.currentTime;
  }
  private MakeClip() {
    this.$rpc.MakeClip(this.$route.params.filename, this.begin, this.end);
    this.saveLongPressProgress = 0;
    this.newClipScheduled = true;
    this.resetMakeClipBtnIconTimer = setTimeout(() => this.newClipScheduled = false, this.MAKE_CLIP_BTN_RESET_DELAY);
  }
  private OnHoldMakeClipBtn(progress: number) {
    this.saveLongPressProgress = progress;
  }
  private MakeClipCancel() {
    this.saveLongPressProgress = 0;
  }
  private TimeUpdate(time: number) {
    this.currentTime = time;
  }
  private get ClipSelection() {
    const nonSelected = '#ffffff00';
    const selected = '#1565c0';
    return [
      { color: nonSelected, stop: this.begin / this.Duration * 100 },
      { color: selected, stop: this.end / this.Duration * 100 },
      { color: nonSelected, stop: 100 }];
  }
  private get MakeClipBtnIcon() {
    return this.newClipScheduled ? 'mdi-check' : 'mdi-content-save';
  }
  private get ClipBtnDisabled() {
    return this.begin >= this.end;
  }
}
</script>