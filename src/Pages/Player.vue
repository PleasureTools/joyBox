<template>
  <VideoPlayer class="fill-height" :src="Source"/>
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

@Component({ components: { VideoPlayer }})
export default class Player extends Mixins(RefsForwarding) {
  private get Source() {
    return `${this.Env.Origin}/archive/${this.$route.params.filename}`;
  }
}
</script>