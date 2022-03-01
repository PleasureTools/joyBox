<template>
 <v-card>
    <v-img :src="file.thumbnail" @click="Play" :aspect-ratio="16/9">
        <span class="title font-weight-medium">{{ file.title }}</span>
        <span class="duration font-weight-medium">{{ Duration(file.duration) }}</span>
        <VideoPlayer v-if="playMode" :src="VideoFilename" autoplay="true" class="video-player" />
    </v-img>
    <v-card-text class="py-0 px-2 mt-1 text-right">
      <span class="size">{{ Size}}</span>
      <TimeAgo :value="file.timestamp" />
    </v-card-text>
    <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="Add(file)" icon>
            <v-icon>mdi-plus</v-icon>
        </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.video-player {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
.title {
  position: absolute;
  width: 100%;
  text-align: center;
  color: white;
  text-shadow: 1px 1px 1px black;
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
import fd from 'format-duration';
import prettyBytes from 'pretty-bytes';
import { Component, Emit, Mixins, Prop, Vue } from 'vue-property-decorator';

import { playlistAddRecordDlgPlay } from '@/EventBusTypes';
import EventBus from '@/Mixins/EventBus';
import { SerializedFileRecord as FileRecord } from '@Shared/Types';
import { VideoFromFilename } from '../../Common/VideoFromFilename';
import TimeAgo from '../TimeAgo.vue';
import VideoPlayer from '../VideoPlayer.vue';

@Component({
  components: {
    TimeAgo,
    VideoPlayer
  }
})
export default class RecordCard extends Mixins(EventBus) {
  @Prop({ required: true })
  private readonly file!: FileRecord;

  @Emit('add')
  private Add() {}

  private playMode = false;

  private playlistAddRecordDlgPlayUnsub!: () => void;

  public mounted(): void {
    this.playlistAddRecordDlgPlayUnsub = this.EventBus.subscribe(playlistAddRecordDlgPlay, e => {
      if (this.file.filename !== e.payload.filename) {
        this.playMode = false;
      }
    });
  }

  public destroyed(): void {
    this.playlistAddRecordDlgPlayUnsub();
  }

  private get Size() { return prettyBytes(this.file.size); }

  private get VideoFilename() {
    return VideoFromFilename(this.file.filename);
  }

  private Duration(duration: number) {
    return fd(duration * 1000);
  }

  private Play() {
    this.EventBus.publish(playlistAddRecordDlgPlay({ filename: this.file.filename }));
    this.playMode = true;
  }
}
</script>
