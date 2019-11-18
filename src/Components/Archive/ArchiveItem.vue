<template>
  <v-col cols="12" sm="4">
    <v-card>
      <router-link :to="`/player/${file.filename}`">
        <v-img
          v-bind:class="[{ removed: BeforeRemove }]"
          :src="file.thumbnail"
          :aspect-ratio="16/9"
        >
          <span class="duration font-weight-medium">{{ Duration(file.duration) }}</span>
        </v-img>
      </router-link>
      <v-progress-linear v-visible="progress" color="accent" :value="progress"></v-progress-linear>
      <v-card-text class="py-0 px-2 text-right">
        <TimeAgo :value="file.timestamp" />
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn icon>
          <v-icon>mdi-tag</v-icon>
        </v-btn>
        <LongPressButton
          :holdTime="1200"
          :steps="25"
          @longpress="RemoveArchiveRecord(file.filename)"
          @update="RemoveProgress"
          @cancel="Cancel"
        >
          <v-icon>mdi-delete</v-icon>
        </LongPressButton>
      </v-card-actions>
    </v-card>
  </v-col>
</template>

<style scoped>
.removed {
  filter: grayscale(100%) blur(3px);
  transition: all 1s ease;
}
.duration {
  position: absolute;
  right: 0;
  bottom: 0;
  margin: 5px;
  padding: 0 3px;
  color: white;
  background-color: black;
}
</style>

<script lang="ts">
import df from 'dateformat';
import fd from 'format-duration';
import prettyMs from 'pretty-ms';
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';

import { visible } from '@/Directives';
import { FileRecord, Plugin, Stream } from '@/types';

import { TimeAgo } from '@/Components';
import LongPressButton from '@/Components/LongPressButton.vue';
import PluginIcon from '@/Components/PluginIcon.vue';

@Component({
  components: {
    LongPressButton,
    PluginIcon,
    TimeAgo
  },
  directives: {
    visible
  }})
export default class ArchiveItem extends Vue {
  private progress: number = 0;

  @Prop() private file!: FileRecord;

  private get BeforeRemove() {
    return this.progress === 100;
  }

  private RemoveArchiveRecord(filename: string) {
    this.$rpc.RemoveArchiveRecord(filename);
  }

  private Duration(duration: number) {
    return fd(duration * 1000);
  }

  private RemoveProgress(progress: number) {
    this.progress = progress;
  }

  private Cancel() {
    this.progress = 0;
  }
}
</script>