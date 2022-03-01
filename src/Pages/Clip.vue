<template>
  <VideoPlayer id="clip-player" class="fill-height" :src="Source" @timeupdate="TimeUpdate">
    <SegmentedColorLine class="clip-selection" :height="3" :color-map="ClipSelection" />
    <v-spacer></v-spacer>
    <v-btn @click="MakeClip" :disabled="ClipBtnDisabled" icon>
      <v-icon color="#e5e5e5">mdi-content-save</v-icon>
    </v-btn>
    <v-btn icon @click="BeginAtCurrentTime">
      <v-icon color="#e5e5e5">mdi-alpha-b-circle</v-icon>
    </v-btn>
    <v-btn icon @click="EndAtCurrentTime">
      <v-icon color="#e5e5e5">mdi-alpha-e-circle</v-icon>
    </v-btn>
    <div class="clip-duration">{{ ClipDuration }}</div>
    <v-dialog attach="#clip-player" width="200" v-model="makeClipDlgModel" class="make-clip-dlg">
      <v-card>
        <v-card-actions class="make-clip-dlg-actions">
          <v-btn class="make-clip-dlg-btns" @click="MakeClipCopyStream">Copy stream</v-btn>
          <v-btn v-if="!Record.reencoded" class="make-clip-dlg-btns" @click="MakeClipReEncode">Re-encode</v-btn>
          <v-btn class="make-clip-dlg-btns" @click="MakeClipCancel">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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

.make-clip-dlg-actions {
  display: flex;
  flex-direction: column;
}

.make-clip-dlg-btns {
  width: 150px;
  margin: 10px;
}
</style>

<script lang="ts">
import fd from 'format-duration';
import { Component, Mixins } from 'vue-property-decorator';

import LongPressButton from '@/Components/LongPressButton.vue';
import SegmentedColorLine from '@/Components/SegmentedColorLine.vue';
import VideoPlayer from '@/Components/VideoPlayer.vue';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { Route } from 'vue-router';

@Component({
  components: {
    SegmentedColorLine,
    LongPressButton,
    VideoPlayer
  }
})
export default class Clip extends Mixins(RefsForwarding) {
  private begin = 0;
  private end = 0;
  private currentTime = 0;
  private autoAlignEnd = false;
  private makeClipDlgModel = false;

  public async created(): Promise<void> {
    if (await this.ClipSettings.HasSettings(this.$route.params.filename)) {
      ({ begin: this.begin, end: this.end } = this.ClipSettings.Settings);
    } else {
      this.end = this.Duration;

      this.ClipSettings.Reset();
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  public beforeRouteLeave(to: Route, from: Route, next: any): void {
    if (!(this.autoAlignEnd || (this.begin === 0 && this.end === this.Duration))) {
      this.ClipSettings.Backup({ begin: this.begin, end: this.end, filename: from.params.filename });
    }

    next();
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

  private BeginAtCurrentTime() {
    this.begin = this.currentTime;

    if (this.autoAlignEnd) {
      if (this.begin >= this.end) {
        this.end = this.Duration;
      }

      this.autoAlignEnd = false;
    }
  }

  private EndAtCurrentTime() {
    this.end = this.currentTime;
  }

  private async MakeClip() {
    this.makeClipDlgModel = true;
  }

  private MakeClipCopyStream() {
    this.$rpc.MakeClip(this.$route.params.filename, this.begin, this.end, false);

    this.makeClipDlgModel = false;
    this.autoAlignEnd = true;
  }

  private MakeClipReEncode() {
    this.$rpc.MakeClip(this.$route.params.filename, this.begin, this.end, true);

    this.makeClipDlgModel = false;
    this.autoAlignEnd = true;
  }

  private MakeClipCancel() {
    this.makeClipDlgModel = false;
  }

  private get ClipSelection() {
    const nonSelected = '#ffffff00';
    const selected = '#1565c0';
    return [
      { color: nonSelected, stop: this.begin / this.Duration * 100 },
      { color: selected, stop: this.end / this.Duration * 100 },
      { color: nonSelected, stop: 100 }];
  }

  private get ClipBtnDisabled() {
    return this.begin >= this.end;
  }

  private TimeUpdate(time: number) {
    this.currentTime = time;
  }
}
</script>
