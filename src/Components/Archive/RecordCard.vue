<template>
  <v-card>
    <router-link :to="`/player/${file.filename}`">
      <v-img :src="file.thumbnail" :aspect-ratio="16/9">
        <span class="title font-weight-medium">{{ file.title }}</span>
        <span class="duration font-weight-medium">{{ Duration(file.duration) }}</span>
      </v-img>
    </router-link>
    <v-card-text class="py-0 px-2 mt-1 text-right">
      <v-icon v-if="file.reencoded">mdi-alpha-e-circle</v-icon>
      <span class="size">{{ Size}}</span>
      <TimeAgo :value="file.timestamp" />
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn v-if="!UnderObserve" @click="AddObservable" icon :disabled="App.NonFullAccess">
        <v-icon>mdi-eye-plus</v-icon>
      </v-btn>
      <v-btn icon @click="OpenActionMenu">
        <v-icon>mdi-menu</v-icon>
      </v-btn>
    </v-card-actions>
    <ActionMenu
      v-if="actionMenuShown"
      @close="CloseActionMenu"
      @action="ActionMenu"
      :record="file"
    />
    <TagManager v-if="tagManagerShown" @close="CloseTagManager" :record="file" />
  </v-card>
</template>

<style scoped>
.title {
  position: absolute;
  width: 100%;
  text-align: center;
  color: white;
  text-shadow: 1px 1px 1px black;
}
.duration {
  position: absolute;
  right: 0;
  bottom: 0;
  margin: 5px;
  padding: 0 3px;
  color: white;
  background-color: black;
}
.size {
  margin-right: 10px;
}
</style>

<script lang="ts">
import 'reflect-metadata';

import df from 'dateformat';
import fd from 'format-duration';
import prettyBytes from 'pretty-bytes';
import prettyMs from 'pretty-ms';
import { Component, Emit, Mixins, Prop, Vue } from 'vue-property-decorator';

import { visible } from '@/Directives';
import { Plugin, Stream } from '@/types';

import { ExtractSourceFromUrl } from '@/Common/Util';
import ActionMenu from '@/Components/Archive/ActionMenu.vue';
import TagManager from '@/Components/Archive/TagManager.vue';
import LongPressButton from '@/Components/LongPressButton.vue';
import TimeAgo from '@/Components/TimeAgo.vue';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { SerializedFileRecord as FileRecord } from '@Shared/Types';
import { Action } from './Action';

@Component({
  components: {
    ActionMenu,
    LongPressButton,
    TagManager,
    TimeAgo
  },
  directives: {
    visible
  }
})
export default class RecordCard extends Mixins(RefsForwarding) {
  private actionMenuShown = false;
  private tagManagerShown = false;
  @Prop({ required: true }) private readonly file!: FileRecord;
  private async AddObservable() {
    if ((await this.$rpc.AddObservable(this.file.source)).result) { this.$notification.Show('Added'); }
  }

  private get UnderObserve() {
    return this.App.observables.some(x => ExtractSourceFromUrl(x.uri) === ExtractSourceFromUrl(this.file.source));
  }

  private get Size() { return prettyBytes(this.file.size); }
  private Duration(duration: number) {
    return fd(duration * 1000);
  }

  private OpenActionMenu() {
    this.actionMenuShown = true;
  }

  private CloseActionMenu() {
    this.actionMenuShown = false;
  }

  private CloseTagManager() {
    this.tagManagerShown = false;
  }

  private ActionMenu(action: Action) {
    switch (action) {
      case Action.OPEN_TAG_MANAGER:
        this.CloseActionMenu();
        this.tagManagerShown = true;
        break;
      default:
        throw new Error('Unknown action');
    }
  }
}
</script>
