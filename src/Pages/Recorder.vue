<template>
  <div>
    <v-app-bar app color="primary">
      <v-btn icon to="/">
        <v-icon>arrow_back</v-icon>
      </v-btn>
      <v-toolbar-title>Active Recordings</v-toolbar-title>
      <v-spacer></v-spacer>
      <NoConnectionIcon />
    </v-app-bar>
    <v-list v-if="HasActiveRecordings" two-line>
      <v-list-item v-for="record in App.activeRecordings" :key="record.label">
        <v-list-item-content>
          <v-list-item-title>{{ record.label }}</v-list-item-title>
          <v-list-item-subtitle>
            <span class="bitrate">{{ Bitrate(record) }}</span>
            <span class="size">{{ Size(record) }}</span>
            <v-icon size="19" :class="{paused: record.paused}">cloud_download</v-icon>
            <span class="duration">{{ Duration(record) }}</span>
            <v-icon size="19">access_time</v-icon>
          </v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <v-btn icon @click="StopRecording(record.label)" :disabled="App.NonFullAccess">
            <v-icon>stop</v-icon>
          </v-btn>
        </v-list-item-action>
      </v-list-item>
    </v-list>
    <p v-else class="text-center font-weight-bold display-3 blue-grey--text text--lighten-4">No data</p>
  </div>
</template>

<style scoped>
.bitrate {
  margin-right: 10px;
}
.size {
  margin-right: 5px;
}
.duration {
  margin: 0 5px 0 10px;
}
.paused {
  animation: blinker 1.5s linear infinite;
}
@keyframes blinker {
  50% {
    opacity: 0;
  }
}
</style>

<script lang="ts">
import prettyBytes from 'pretty-bytes';
import prettyMs from 'pretty-ms';
import { Component, Mixins, Vue } from 'vue-property-decorator';

import NoConnectionIcon from '@/Components/NoConnectionIcon.vue';
import { AppThemeColor } from '@/MetaInfo';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { RecordInfo } from '@/types';

@Component({
  metaInfo() {
    return {
      meta: [
        AppThemeColor(this.$vuetify)
      ]
    };
  },
  components: {
    NoConnectionIcon
  }
})
export default class Recorder extends Mixins(RefsForwarding) {
  private get HasActiveRecordings() {
    return this.App.TotalActiveRecordings > 0;
  }

  private Bitrate(record: RecordInfo) {
    return prettyBytes(record.bitrate) + '/s';
  }

  private Size(record: RecordInfo) {
    return prettyBytes(record.size);
  }

  private Duration(record: RecordInfo) {
    return prettyMs(record.time);
  }

  private StopRecording(label: string) {
    this.$rpc.StopRecording(label);
  }
}
</script>