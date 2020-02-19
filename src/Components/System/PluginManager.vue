<template>
  <v-card>
    <v-list v-if="HasPlugins">
      <draggable handle=".handle" @update="OnUpdate">
        <v-list-item v-for="(plugin, i) in App.plugins" :key="plugin.id">
          <v-icon class="handle">mdi-drag</v-icon>
          <v-list-item-content>{{ plugin.name }}</v-list-item-content>
          <v-switch
            v-model="plugin.enabled"
            @change="OnChangePluginEnabled(plugin, i)"
            :loading="pluginStateChangeInProgress[i]"
            :disabled="App.NonFullAccess"
          ></v-switch>
        </v-list-item>
      </draggable>
    </v-list>
    <p v-else class="text-center font-weight-bold display-3 blue-grey--text text--lighten-4">No data</p>
  </v-card>
</template>

<script lang="ts">
import { Component, Mixins, Vue } from 'vue-property-decorator';
import draggable from 'vuedraggable';

import RefsForwarding from '@/Mixins/RefsForwarding';
import { Plugin } from '@/types';

@Component({
  components: {
    draggable
  }
})
export default class PluginManager extends Mixins(RefsForwarding) {
  private pluginStateChangeInProgress: boolean[] = [];
  public mount() {
    this.pluginStateChangeInProgress = new Array(this.App.plugins.length).fill(false);
  }
  private get HasPlugins() { return this.App.plugins.length > 0; }
  private OnUpdate(evt: any, originalEvent: any) {
    this.$rpc.ReorderPlugin(evt.oldIndex, evt.newIndex);
  }
  private async OnChangePluginEnabled(plugin: Plugin, index: number) {
    this.$set(this.pluginStateChangeInProgress, index, true);

    try {
      if (!await this.$rpc.EnablePlugin(plugin.id, plugin.enabled))
        plugin.enabled = !plugin.enabled;
    } catch (e) {
      plugin.enabled = !plugin.enabled;
    }
    this.$set(this.pluginStateChangeInProgress, index, false);

  }
}
</script>