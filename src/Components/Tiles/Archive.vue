<template>
  <v-list class="property-list font-weight-black">
    <v-list-item v-if="HasNewRecords" class="new-records">
      <v-badge color="red">
        <template v-slot:badge>
          <span>{{ App.NewRecordsCount }}</span>
        </template>
        <v-icon>mdi-eye-outline</v-icon>
      </v-badge>
    </v-list-item>
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
.new-records {
  position: absolute;
  right: 17px;
  top: 7px;
}
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

@Component
export default class Archive extends Mixins(RefsForwarding) {
  private get Duration(): string {
    return prettyMs(this.App.ArchiveTotalDuration * 1000);
  }
  private get HasNewRecords() { return this.App.NewRecordsCount > 0; }
}
</script>