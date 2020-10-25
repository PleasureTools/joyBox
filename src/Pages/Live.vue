<template>
  <div ref="container" class="player-container">
    <video ref="video" class="fill-height"></video>
    <v-btn icon @click="ToggleFullscreen" class="fullscreen-btn">
      <v-icon color="#e5e5e5">fullscreen</v-icon>
    </v-btn>
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
.fullscreen-btn {
    position: absolute;
    bottom: 0;
    right: 0;
}
</style>

<script lang="ts">
import Hls from 'hls.js';
import { Component, Emit, Mixins, Model, Prop, Ref, Vue } from 'vue-property-decorator';

import RefsForwarding from '@/Mixins/RefsForwarding';
import { Route } from 'vue-router';

@Component
export default class Live extends Mixins(RefsForwarding) {
  @Ref() private readonly container!: HTMLElement;
  @Ref() private readonly video!: HTMLVideoElement;

  private hls!: Hls;

  public mounted() {
    const label = `https://${this.$route.params.provider}/${this.$route.params.channel}`;

    const recordingInfo = this.App.activeRecordings.find(x => x.label.startsWith(label));

    if (!recordingInfo) {
      this.$router.go(-1);
      return;
    }

    this.hls = new Hls();
    this.hls.loadSource(recordingInfo.streamUrl);
    this.hls.attachMedia(this.video);

    this.hls.on(Hls.Events.MANIFEST_PARSED, () => this.video.play());
  }

  public destroyed() {
    this.hls.destroy();
  }

  private ToggleFullscreen() {
    const o = 'landscape-primary';
    document.fullscreenElement === this.container ?
      document.exitFullscreen() :
      this.container.requestFullscreen(), screen.orientation.type !== o && screen.orientation.lock(o);
  }
}
</script>