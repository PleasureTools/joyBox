<template>
  <span>{{ App.TotalActiveRecordings }}</span>
</template>

<style scoped>
span {
  font-size: 4.5em;
}
</style>

<script lang="ts">
import { Component, Mixins, Vue } from 'vue-property-decorator';

import RefsForwarding from '@/Mixins/RefsForwarding';

@Component
export default class RecorderTile extends Mixins(RefsForwarding) { }
</script>