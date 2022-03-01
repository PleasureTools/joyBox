<template>
  <VideoPlayer class="fill-height" :src="Source">
    <v-spacer></v-spacer>
    <div v-if="quickEditShortcuts">
      <v-btn icon :to="Clip">
        <v-icon color="#e5e5e5">mdi-movie-open</v-icon>
      </v-btn>
      <v-btn icon @click="Remove">
        <v-icon color="#e5e5e5">mdi-delete</v-icon>
      </v-btn>
    </div>
  </VideoPlayer>
</template>

<style scoped>
.fill-height {
  height: 100vh;
}
</style>

<script lang="ts">
import { Component, Mixins, Vue } from 'vue-property-decorator';

import VideoPlayer from '@/Components/VideoPlayer.vue';
import RefsForwarding from '@/Mixins/RefsForwarding';

@Component({
  components: { VideoPlayer }
})
export default class Player extends Mixins(RefsForwarding) {
  private quickEditShortcuts!: boolean;
  public created(): void {
    this.quickEditShortcuts = this.$route.query.notification !== undefined;
  }

  private get Source() {
    return `${this.Env.Origin}/archive/${this.$route.params.filename}`;
  }

  private get Clip() {
    return `/clip/${this.$route.params.filename}`;
  }

  private Remove() {
    this.$rpc.RemoveArchiveRecord(this.$route.params.filename);
    window.close();
  }
}
</script>
