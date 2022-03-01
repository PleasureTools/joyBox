<template>
<div class="text-center">
  <v-btn @click="CreatePlaylist" x-large icon><v-icon>mdi-content-save</v-icon></v-btn>
</div>
</template>

<style scoped>
</style>

<script lang="ts">
import { Component, Emit, Mixins, Prop, Vue } from 'vue-property-decorator';

import RefsForwarding from '@/Mixins/RefsForwarding';
import { SerializedArchiveRecord as ArchiveRecord } from '@Shared/Types';
import { Segment } from '../../Components/Playlist/FragmentPreview.vue';

@Component
export default class NewPlaylist extends Mixins(RefsForwarding) {
  @Prop({ required: true })
  private readonly segments!: Segment[];

  @Prop({ required: false })
  private readonly initFilename?: string;

  @Emit('init') private Init(record: ArchiveRecord[]) {}

  public created(): void {
    const record = this.App.archive.find(x => x.filename === this.initFilename);

    this.Init(record ? [record] : []);
  }

  private CreatePlaylist() {
    const segments = this.segments.map(x => ({
      begin: x.begin,
      end: x.end,
      loop: x.loop,
      filename: x.record.filename
    }));

    this.$rpc.CreatePlaylist({ id: -1, timestamp: -1, title: 'playlist', segments });
  }
}
</script>
