<template>
  <div>
    <v-app-bar app color="primary">
      <BackBtn to="/" />
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
            <v-icon size="19" :class="{paused: record.paused}">cloud_download</v-icon>
            <span class="size">{{ Size(record) }}</span>
            <v-icon size="19">access_time</v-icon>
            <span class="duration">{{ Duration(record) }}</span>
          </v-list-item-subtitle>
        </v-list-item-content>
        <v-btn icon v-if="IsCCTVAvailable(record)" :to="LiveStreamPath(record.label)" :disabled="Access.NonFullAccess">
          <v-icon>mdi-cctv</v-icon>
        </v-btn>
        <v-btn icon @click="StopRecording(record.label)" :disabled="Access.NonFullAccess">
          <v-icon>stop</v-icon>
        </v-btn>
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
import { Mixins, Vue } from 'vue-property-decorator';

import { AppComponent } from '@/Common/Decorators/AppComponent';
import BackBtn from '@/Components/BackBtn.vue';
import NoConnectionIcon from '@/Components/NoConnectionIcon.vue';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { RecordingProgressInfo } from '@Shared/Types';

@AppComponent({
  components: {
  BackBtn,
  NoConnectionIcon
  }
  })
export default class Recorder extends Mixins(RefsForwarding) {
  private get HasActiveRecordings() {
    return this.App.TotalActiveRecordings > 0;
  }

  private Bitrate(record: RecordingProgressInfo) {
    return prettyBytes(record.bitrate) + '/s';
  }

  private Size(record: RecordingProgressInfo) {
    return prettyBytes(record.size);
  }

  private Duration(record: RecordingProgressInfo) {
    return prettyMs(record.time);
  }

  private StopRecording(label: string) {
    this.$rpc.StopRecording(label);
  }

  private LiveStreamPath(label: string) {
    // Cut `https://`
    return `/live/${label.slice(8)}`;
  }

  public IsCCTVAvailable(recording: RecordingProgressInfo): boolean {
    return !recording.label.startsWith('https://kick.com');
  }
}
</script>
