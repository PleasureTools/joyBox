<template>
  <div>
    <AddObservableDialog v-model="addDialogShown" />
    <EditObservableDialog v-model="editDialogShown" :target="editableStream" />
    <v-app-bar app color="primary">
      <v-btn icon to="/">
        <v-icon>arrow_back</v-icon>
      </v-btn>
      <v-toolbar-title>Observables</v-toolbar-title>
      <v-spacer></v-spacer>
      <NoConnectionIcon />
      <v-btn icon>
        <v-icon v-if="FilterApplied" v-on:click="RemoveFilter">mdi-filter-remove</v-icon>
        <v-icon v-else v-on:click="ShowFilterInput">mdi-filter</v-icon>
      </v-btn>
      <v-btn icon v-on:click="AddDialogOpen">
        <v-icon>add</v-icon>
      </v-btn>
    </v-app-bar>
    <v-text-field ref="filterInput" v-if="showFilterInput" v-model="filter"></v-text-field>
    <v-list v-if="HasData">
      <template v-for="(o, i) in Observables">
        <ObservableItem v-bind:key="o.uri" :observable="o" @click="OpenEditDialog(o.uri)" />
        <v-divider v-if="i < Observables.length-1" :key="`divider-${o.uri}`"></v-divider>
      </template>
    </v-list>
    <p v-else class="text-center font-weight-bold display-3 blue-grey--text text--lighten-4">No data</p>
  </div>
</template>

<script lang="ts">
import { debounce } from 'debounce';
import { Component, Mixins, Ref, Vue, Watch } from 'vue-property-decorator';

import { BoolFilter, ValidationError } from '@/Common';
import NoConnectionIcon from '@/Components/NoConnectionIcon.vue';
import {
  AddObservableDialog,
  EditObservableDialog,
  ObservableItem
} from '@/Components/Observables';
import ThemeColor from '@/MetaInfo/AppThemeColor';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { NotificationType } from '@/Store/Notification';
import { Stream } from '@/types';

interface HasSortKey {
  readonly sortKey: string;
}

@Component({
  metaInfo() {
    return {
      meta: [
        ThemeColor(this.$vuetify)
      ]
    };
  },
  components: {
    ObservableItem,
    AddObservableDialog,
    EditObservableDialog,
    NoConnectionIcon
  }
})
export default class Observables extends Mixins(RefsForwarding) {
  private addDialogShown = false;
  private editDialogShown = false;

  private editableStream: string = '';

  private filter: string = '';
  private showFilterInput: boolean = false;
  private filterDebounce = debounce(() => this.ApplyFilter(), 200);
  private booleanFilter: BoolFilter | null = null;
   @Ref('filterInput') private filterInput!: HTMLInputElement;

  private get FilterApplied() {
    return this.showFilterInput;
  }

  private get Observables() {
    const Comparator = (a: HasSortKey, b: HasSortKey) => a.sortKey < b.sortKey ? -1 : +1;

    return this.App.observables
      .filter((x: Stream) => !this.booleanFilter || this.booleanFilter.Test(x.uri))
      .map((x: Stream) => ({ ...x, sortKey: this.SortKey(x.uri) }))
      .sort(Comparator);
  }

  private async AddDialogOpen() {
    this.addDialogShown = true;
  }

  private get HasData() {
    return this.Observables.length > 0;
  }

  private OpenEditDialog(url: string) {
    this.editableStream = url;
    this.editDialogShown = true;
  }

  private SortKey(url: string): string {
    const username = (url.split('/').reverse().find(x => x) || '').toLowerCase();
    return this.NormalizeUsername(username);
  }

  private NormalizeUsername(username: string) {
    let normalized = username;
    let sliceStart = 0;
    while (['-', '='].some(x => normalized.startsWith(x, sliceStart)))
      ++sliceStart;

    normalized = normalized.slice(sliceStart);

    return normalized;
  }

  private async ShowFilterInput() {
    this.showFilterInput = true;
    await this.$nextTick();
    this.filterInput.focus();
  }

  private RemoveFilter() {
    this.filter = '';
    this.showFilterInput = false;
  }

  @Watch('filter')
  private OnFilterChange(val: string, oldVal: string) {
    this.filterDebounce();
  }

  private ApplyFilter() {
    try {
      this.booleanFilter = this.filter ? new BoolFilter(this.filter) : null;
    } catch (e) {
      if (e instanceof ValidationError)
      this.Notification.Show({ message: e.Format(), type: NotificationType.ERR });
    }
  }
}
</script>