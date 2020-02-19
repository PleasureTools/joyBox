<template>
  <VideoPlayer class="fill-height" :src="Source" @timeupdate="TimeUpdate">
    <ColorLine class="clip-selection" :height="3" :color-map="ClipSelection" />
    <v-spacer></v-spacer>
    <LongPressButton
      @longpress="SaveBtnMakeClip"
      @update="SaveBtnUpdate"
      @cancel="SaveBtnCancel"
      :holdTime="500"
      :steps="10"
    >
      <span id="tooltip-handler" />
      <v-icon color="#e5e5e5">mdi-content-save</v-icon>
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
#tooltip-handler {
  position: relative;
  left: -70px;
  top: -70px;
}
.clip-duration {
  padding-top: 7px;
  color: #e5e5e5;
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

import { ColorLine, ColorMapItem, LongPressButton, VideoPlayer } from '@/Components';
import RefsForwarding from '@/Mixins/RefsForwarding';

@Component({
  components: {
    ColorLine,
    LongPressButton,
    VideoPlayer
  }
})
export default class Clip extends Mixins(RefsForwarding) {
  private begin: number = 0;
  private end: number = 0;
  private currentTime: number = 0;
  private saveLongPressProgress = 0;
  public created() {
    this.end = this.Duration;
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
  private SaveBtnMakeClip() {
    this.$rpc.MakeClip(this.$route.params.filename, this.begin, this.end);
    this.saveLongPressProgress = 0;
  }
  private SaveBtnUpdate(progress: number) {
    this.saveLongPressProgress = progress;
  }
  private SaveBtnCancel() {
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
}
</script>