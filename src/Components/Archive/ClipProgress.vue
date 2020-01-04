<template>
  <v-col cols="12" sm="4">
    <v-card>
      <v-card-title class="justify-center">
        <v-progress-circular
          class="progress text-center"
          :rotate="-90"
          :size="100"
          :width="15"
          :value="clip.progress"
          color="#03a9f4"
        >{{ clip.progress }}</v-progress-circular>
      </v-card-title>
      <v-card-text class="text-center">{{ Duration(clip.duration) }}</v-card-text>
    </v-card>
  </v-col>
</template>

<style scoped>
.duration {
  font-size: 4em;
}
</style>

<script lang="ts">
import 'reflect-metadata';

import df from 'dateformat';
import fd from 'format-duration';
import prettyMs from 'pretty-ms';
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';

import { visible } from '@/Directives';
import { ClipProgressInfo, FileRecord, Plugin, Stream } from '@/types';

import { TimeAgo } from '@/Components';
import LongPressButton from '@/Components/LongPressButton.vue';
import PluginIcon from '@/Components/PluginIcon.vue';

@Component({
  components: {
    LongPressButton,
    PluginIcon,
    TimeAgo
  }})
export default class ClipProgress extends Vue {
  @Prop({ required: true }) private readonly clip!: ClipProgressInfo;

  private Duration(duration: number) {
    return fd(this.clip.duration * 1000);
  }

}
</script>