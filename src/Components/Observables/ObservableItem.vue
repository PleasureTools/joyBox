<template>
  <v-list-item>
    <v-list-item-avatar>
      <PluginIcon :name="ActivePluginName" />
    </v-list-item-avatar>
    <v-list-item-content>
      <v-list-item-title>{{ observable.uri }}</v-list-item-title>
      <v-list-item-subtitle></v-list-item-subtitle>
      <span class="last-seen" v-if="DisplayLastSeen">
        last seen
        <span v-if="Online">just now</span>
        <TimeAgo v-else :value="observable.lastSeen" />
      </span>
    </v-list-item-content>
    <v-btn icon @click="Click(observable.uri)">
      <v-icon>edit</v-icon>
    </v-btn>
  </v-list-item>
</template>

<style scoped>
.last-seen {
  color: #616161;
  font-size: 0.8em;
}
</style>

<script lang="ts">
import { Component, Emit, Mixins, Prop, Vue } from 'vue-property-decorator';

import { Plugin, Stream } from '@/types';

import { TimeAgo } from '@/Components';
import PluginIcon from '@/Components/PluginIcon.vue';
import RefsForwarding from '@/Mixins/RefsForwarding';

@Component({ components: { PluginIcon, TimeAgo } })
export default class ObservableItem extends Mixins(RefsForwarding) {
  @Prop({ required: true }) private readonly observable!: Stream;
  @Emit() private Click(url: string) { }

  private get ActivePluginName(): string {
    const active = this.observable.plugins.find(x => x.enabled);
    return active && active.name || 'disabled';
  }

  private get DisplayLastSeen() {
    return this.observable.lastSeen !== -1;
  }

  private get Online() {
    return this.App.activeRecordings.some(x => x.label === this.observable.uri);
  }
}
</script>