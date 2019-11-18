<template>
  <v-icon v-if="!App.connected" class="noSignal">signal_cellular_alt</v-icon>
</template>

<style scoped>
.noSignal {
  margin-right: 25px;
  animation: blinker 1.5s linear infinite;
}

@keyframes blinker {
  50% {
    opacity: 0;
  }
}
</style>

<script lang="ts">
import { Component, Mixins, Vue } from 'vue-property-decorator';

import RefsForwarding from '@/Mixins/RefsForwarding';

@Component
export default class NoConnectionIcon extends Mixins(RefsForwarding) { }
</script>