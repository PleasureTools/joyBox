<template>
  <v-card>
    <router-link :to="`/player/playlist_${playlist.pid}`">
      <v-img :src="playlist.thumbnail" :aspect-ratio="16 / 9">
        <span class="title font-weight-medium">{{ playlist.name }}</span>
        <span class="duration font-weight-medium">{{ Duration }}</span>
      </v-img>
    </router-link>
    <v-card-text class="py-0 px-2 mt-1 text-right">
      <TimeAgo :value="playlist.timestamp" />
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn icon @click="OpenActionMenu">
        <v-icon>mdi-menu</v-icon>
      </v-btn>
    </v-card-actions>
    <PlaylistPreviewActionMenu
      v-if="actionMenuShown"
      @close="CloseActionMenu"
      :id="playlist.pid"
    />
  </v-card>
</template>

<style scoped>
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
</style>

<script lang="ts">
import fd from 'format-duration';
import { Component, Prop, Vue } from 'vue-property-decorator';

import TimeAgo from '@/Components/TimeAgo.vue';
import { Playlist } from '@Shared/Types';
import PlaylistPreviewActionMenu from './PlaylistPreviewActionMenu.vue';

@Component({
  components: {
    PlaylistPreviewActionMenu,
    TimeAgo
  }
})
export default class PlaylistCard extends Vue {
  @Prop({ required: true }) private readonly playlist!: Playlist & {
    pid: number;
  };

  private actionMenuShown = false;

  public get Duration(): string {
    return fd(this.playlist.segments.reduce((a, x) => a + (x.end - x.begin) * x.loop, 0) * 1000);
  }

  private OpenActionMenu() {
    this.actionMenuShown = true;
  }

  private CloseActionMenu() {
    this.actionMenuShown = false;
  }
}
</script>
