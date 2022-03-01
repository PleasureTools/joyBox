<template>
  <v-list class="action-menu">
    <v-list-item-group>
      <v-list-item @click="Delete" :disabled="IsUndeletable">
        <v-list-item-icon>
          <v-icon>mdi-delete</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Delete</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item :to="ClipRoute" @click="close">
        <v-list-item-icon>
          <v-icon>mdi-movie-open</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Clip</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item @click="OpenPlaylistCreator">
        <v-list-item-icon>
          <v-icon>mdi-playlist-plus</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Add to playlist</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item @click="OpenTagManager">
        <v-list-item-icon>
          <v-icon>mdi-tag</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Tags</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item v-if="UnderObserve" @click="RemoveObservable">
        <v-list-item-icon>
          <v-icon>mdi-eye-minus</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Remove source</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item v-else @click="AddObservable">
        <v-list-item-icon>
          <v-icon>mdi-eye-plus</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Add source</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item @click="FilterBySource">
        <v-list-item-icon>
          <v-icon>mdi-filter-variant</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Filter by source</v-list-item-title>
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
import { Component, Emit, Mixins, Model, Prop, Vue } from 'vue-property-decorator';

import { ExtractSourceFromUrl } from '@/Common/Util';
import { filterBySource } from '@/EventBusTypes';
import EventBus from '@/Mixins/EventBus';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { SerializedFileRecord as FileRecord } from '@Shared/Types';
import { Action } from './Action';

@Component
export default class ActionMenu extends Mixins(RefsForwarding, EventBus) {
  @Prop({ required: true }) private readonly record!: FileRecord;

  @Emit() private close() { }

  @Emit() private action(action: Action) { }

  private get IsUndeletable() { return this.record.locked || this.Access.NonFullAccess; }

  private get ClipRoute() { return '/clip/' + this.record.filename; }

  private async Delete() {
    if (await this.$confirm.Show('Delete?')) { this.$rpc.RemoveArchiveRecord(this.record.filename); }
  }

  private get UnderObserve() {
    return this.App.observables.some(x => ExtractSourceFromUrl(x.uri) === ExtractSourceFromUrl(this.record.source));
  }

  private async AddObservable() {
    if ((await this.$rpc.AddObservable(this.record.source)).result) { this.$notification.Show('Added'); }

    this.close();
  }

  private async RemoveObservable() {
    if ((await this.$rpc.RemoveObservable(this.record.source))) { this.$notification.Show('Removed'); }

    this.close();
  }

  private FilterBySource() {
    this.EventBus.publish(filterBySource({ source: ExtractSourceFromUrl(this.record.source) }));
    this.close();
  }

  private OpenTagManager() { this.action(Action.OPEN_TAG_MANAGER); }

  private OpenPlaylistCreator() {
    this.$router.push({ name: 'playlist.new', params: { initFilename: this.record.filename } });
  }
}
</script>
