<template>
  <v-card>
    <router-link :to="`/player/${file.filename}`">
      <v-img v-bind:class="[{ removed: BeforeRemove }]" :src="file.thumbnail" :aspect-ratio="16/9">
        <span class="duration font-weight-medium">{{ Duration(file.duration) }}</span>
      </v-img>
    </router-link>
    <v-progress-linear v-visible="progress" color="accent" :value="progress"></v-progress-linear>
    <v-card-text class="py-0 px-2 text-right">
      <span class="size">{{ Size}}</span>
      <TimeAgo :value="file.timestamp" />
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn v-if="!UnderObserve" @click="AddObservable" icon :disabled="App.NonFullAccess">
        <v-icon>mdi-eye-plus</v-icon>
      </v-btn>
      <v-btn icon :to="ClipRoute" :disabled="App.NonFullAccess">
        <v-icon>mdi-movie-open</v-icon>
      </v-btn>
      <LongPressButton
        :holdTime="1200"
        :steps="25"
        @longpress="RemoveArchiveRecord(file.filename)"
        @update="RemoveProgress"
        @cancel="Cancel"
        :disabled="App.NonFullAccess || file.locked"
      >
        <v-icon>mdi-delete</v-icon>
      </LongPressButton>
    </v-card-actions>
  </v-card>
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
.size {
  margin-right: 10px;
}
</style>

<script lang="ts">
import 'reflect-metadata';

import df from 'dateformat';
import fd from 'format-duration';
import prettyBytes from 'pretty-bytes';
import prettyMs from 'pretty-ms';
import { Component, Emit, Mixins, Prop, Vue } from 'vue-property-decorator';

import { visible } from '@/Directives';
import { FileRecord, Plugin, Stream } from '@/types';

import { TimeAgo } from '@/Components';
import LongPressButton from '@/Components/LongPressButton.vue';
import PluginIcon from '@/Components/PluginIcon.vue';
import RefsForwarding from '@/Mixins/RefsForwarding';

@Component({
  components: {
    LongPressButton,
    PluginIcon,
    TimeAgo
  },
  directives: {
    visible
  }})
export default class ArchiveItem extends Mixins(RefsForwarding) {
  private progress: number = 0;

  @Prop({ required: true }) private readonly file!: FileRecord;

  private get BeforeRemove() {
    return this.progress === 100;
  }
  private async AddObservable() {
    if ((await this.$rpc.AddObservable(this.file.source)).result)
      this.Notification.Show({ message: 'Added' });
  }
  // Cast to 'provider/streamer' form
  private Normalize(url: string) {
    const ret = url.toLowerCase().split('/').filter(x => x);
    if (ret.length < 2) return '';
    const temp = ret[1].split('.');
    temp.length > 2 && (ret[1] = temp.slice(1).join('.'));
    return ret.slice(1).join('/');
  }
  private get UnderObserve() {
    return this.App.observables.some(x => this.Normalize(x.uri) === this.Normalize(this.file.source));
  }
  private get ClipRoute() { return '/clip/' + this.file.filename; }
  private get Size() { return prettyBytes(this.file.size); }

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