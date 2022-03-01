<template>
  <v-list class="action-menu">
    <v-list-item-group>
      <v-list-item @click="Delete">
        <v-list-item-icon>
          <v-icon>mdi-delete</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Delete</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item @click="close">
        <v-list-item-icon>
          <v-icon>mdi-close</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Close</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list-item-group>
  </v-list>
</template>

<style scoped>
.action-menu {
  position: absolute;
  overflow-y: auto;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
</style>

<script lang="ts">
import 'reflect-metadata';
import { Component, Emit, Mixins, Prop } from 'vue-property-decorator';

import EventBus from '@/Mixins/EventBus';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { Action } from './Action';

@Component
export default class ActionMenu extends Mixins(RefsForwarding, EventBus) {
  @Prop({ required: true }) private readonly id!: number;

  @Emit() private close() { }

  @Emit() private action(action: Action) { }

  private async Delete() {
    if (await this.$confirm.Show('Delete?')) { this.$rpc.RemovePlaylist(this.id); }
  }
}
</script>
