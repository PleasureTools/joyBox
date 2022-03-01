<template>
  <v-list-item>
    <v-list-item-avatar>
      <PluginIcon :name="ActivePluginName" />
      <v-icon v-if="!observable.valid" class="valid">mdi-alert-circle</v-icon>
    </v-list-item-avatar>
    <v-list-item-content>
      <v-list-item-title>{{ observable.uri }}</v-list-item-title>
      <v-list-item-subtitle></v-list-item-subtitle>
      <span class="last-seen" v-if="DisplayLastSeen">
        last seen
        <span v-if="Online">just now</span>
        <TimeAgo :class="LastSeenClass" v-else :value="observable.lastSeen" />
        <v-icon size="19" class="download-icon">cloud_download</v-icon>
        <span>{{ Download }}</span>
      </span>
    </v-list-item-content>
    <v-btn icon @click="Click(observable.uri)">
      <v-icon>edit</v-icon>
    </v-btn>
  </v-list-item>
</template>

<style scoped>
.valid {
  position: absolute;
  color: #e53935;
  right: -19px;
  top: -15px;
}

.last-seen {
  color: #616161;
  font-size: 0.8em;
}

.last-seen-twoweeks {
  color: #d55307;
}

.last-seen-month {
  color: #d73d32;
  font-weight: bold;
}

.download-icon {
  margin-left: 7px;
}
</style>

<script lang="ts">
import { Component, Emit, Mixins, Prop, Vue } from 'vue-property-decorator';

import { Plugin, Stream } from '@/types';

import PluginIcon from '@/Components/PluginIcon.vue';
import TimeAgo from '@/Components/TimeAgo.vue';
import RefsForwarding from '@/Mixins/RefsForwarding';
import prettyBytes from 'pretty-bytes';

@Component({ components: { PluginIcon, TimeAgo } })
export default class ObservableItem extends Mixins(RefsForwarding) {
  @Prop({ required: true }) private readonly observable!: Stream;
  @Emit() private Click(url: string) { }

  private get ActivePluginName(): string {
    const active = this.observable.plugins.find(x => x.enabled);
    return (active && active.name) || 'disabled';
  }

  private get DisplayLastSeen() {
    return this.observable.lastSeen !== -1;
  }

  private get Online() {
    return this.App.activeRecordings.some(x => x.label === this.observable.uri);
  }

  private get Download() {
    return prettyBytes(this.observable.download);
  }

  private get LastSeenClass() {
    const elapsed = Date.now() / 1000 - this.observable.lastSeen;
    if (elapsed > 30 * 24 * 60 * 60) {
      return 'last-seen-month';
    } else if (elapsed > 14 * 24 * 60 * 60) {
      return 'last-seen-twoweeks';
    }

    return '';
  }
}
</script>
