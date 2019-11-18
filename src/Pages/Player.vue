<template>
  <video class="player" :src="Source" preload="metadata" controls controlslist="nodownload">No fap</video>
</template>

<style scoped>
.player {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>

<script lang="ts">
import { Component, Mixins, Vue } from 'vue-property-decorator';

import RefsForwarding from '@/Mixins/RefsForwarding';

@Component
export default class Player extends Mixins(RefsForwarding) {
  private get Source() {
    return `${this.Env.Origin}/archive/${this.$route.params.filename}`;
  }
}
</script>