<template>
  <v-list class="property-list font-weight-black">
    <v-list-item>
      <v-list-item-title class="property text-left">Records</v-list-item-title>
      <v-list-item-subtitle class="text-left">
        <span class="value text-left">{{ App.ArchiveTotalRecords }}</span>
      </v-list-item-subtitle>
    </v-list-item>
    <v-list-item>
      <v-list-item-title class="property text-left">Total duration</v-list-item-title>
      <v-list-item-subtitle class="text-left">
        <span calss="value">{{ Duration }}</span>
      </v-list-item-subtitle>
    </v-list-item>
  </v-list>
</template>

<style scoped>
.property-list {
  margin: 0 25px;
}
.property {
  font-size: 1.2em;
}
.value {
  font-size: 1.2em;
}
</style>

<script lang="ts">
import prettyMs from 'pretty-ms';
import { Component, Mixins, Vue } from 'vue-property-decorator';

import RefsForwarding from '@/Mixins/RefsForwarding';
import { ArchiveRecord } from '@/types';

@Component
export default class ArchiveTile extends Mixins(RefsForwarding) {
  private get Duration(): string {
    return prettyMs(this.App.ArchiveTotalDuration * 1000);
  }
}
</script>