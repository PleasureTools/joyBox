<template>
  <div>
    <v-app-bar app color="primary">
      <v-btn icon to="/">
        <v-icon>arrow_back</v-icon>
      </v-btn>
      <v-toolbar-title>Archive</v-toolbar-title>
      <v-spacer></v-spacer>
      <NoConnectionIcon />
    </v-app-bar>
    <v-container v-if="HasRecords" grid-list-sm fluid>
      <v-row>
        <ClipProgress v-for="clip in App.clipProgress" :key="'clip_'+clip.label" :clip="clip" />
        <ArchiveItem v-for="file in Files" :key="file.filename" :file="file" />
      </v-row>
    </v-container>
    <p v-else class="text-center font-weight-bold display-3 blue-grey--text text--lighten-4">No data</p>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Vue } from 'vue-property-decorator';

import { ArchiveItem, ClipProgress } from '@/Components/Archive';
import NoConnectionIcon from '@/Components/NoConnectionIcon.vue';
import { AppThemeColor } from '@/MetaInfo';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { ArchiveRecord, FileRecord } from '@/types';

@Component({
  metaInfo() {
    return {
      meta: [
        AppThemeColor(this.$vuetify)
      ]
    };
  },
  components: {
    ArchiveItem,
    ClipProgress,
    NoConnectionIcon
  }})
export default class Archive extends Mixins(RefsForwarding) {
  private ThumbnailFromFilename(filename: string) {
    return `${this.Env.Origin}/archive/thumbnail/${filename.slice(0, filename.lastIndexOf('.'))}.jpg`;
  }
  private get Files(): FileRecord[] {
    return this.App.RecordsByNewest
      .map((x: ArchiveRecord) => ({ ...x, thumbnail: this.ThumbnailFromFilename(x.filename) }));
  }

  private get HasRecords() {
    return this.Files.length;
  }
}
</script>