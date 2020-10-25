<template>
  <div>
    <AddObservableDialog v-model="addDialogShown" />
    <EditObservableDialog v-model="editDialogShown" :target="editableStream" />
    <v-app-bar app color="primary">
      <BackBtn />
      <v-toolbar-title>Observables</v-toolbar-title>
      <v-spacer></v-spacer>
      <NoConnectionIcon />
      <v-btn icon>
        <v-icon v-if="FilterApplied" @click="RemoveFilter">mdi-filter-remove</v-icon>
        <v-icon v-else @click="ShowFilterInput">mdi-filter</v-icon>
      </v-btn>
      <v-btn icon @click="AddDialogOpen" :disabled="Access.NonFullAccess">
        <v-icon>add</v-icon>
      </v-btn>
    </v-app-bar>
    <SearchFilter
      :nodeType="filterType"
      v-model="filter"
      @updateInstance="UpdateFilterInstance"
      @validationError="FilterValidationError"
      v-if="showFilterInput"
    >
      <template v-slot:info>
        <FilterInfo />
      </template>
    </SearchFilter>
    <v-list v-if="HasData">
      <template v-for="(o, i) in Observables">
        <ObservableItem :key="o.uri" :observable="o" @click="OpenEditDialog(o.uri)" />
        <v-divider v-if="i < Observables.length-1" :key="`divider-${o.uri}`"></v-divider>
      </template>
    </v-list>
    <p v-else class="text-center font-weight-bold display-3 blue-grey--text text--lighten-4">No data</p>
  </div>
</template>

<script lang="ts">
import { interval, Subject, Subscription } from 'rxjs';
import { debounce } from 'rxjs/operators';
import { Mixins, Ref, Vue, Watch } from 'vue-property-decorator';

import { BoolFilter, ValidationError, ValueNode } from '@/Common';
import { ObservableValueNode } from '@/Common/BoolFilterTemplates/ObservableValueNode';
import { AppComponent } from '@/Common/Decorators/AppComponent';
import BackBtn from '@/Components/BackBtn.vue';
import { Chip, default as InputWithChips, Shape } from '@/Components/InputWithChips.vue';
import NoConnectionIcon from '@/Components/NoConnectionIcon.vue';
import {
  AddObservableDialog,
  EditObservableDialog,
  ObservableItem
} from '@/Components/Observables';
import FilterInfo from '@/Components/Observables/FilterInfo.vue';
import SearchFilter from '@/Components/SearchFilter/SearchFilter.vue';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { NotificationType } from '@/Plugins/Notifications/Types';
import { InputEventSubject, Stream } from '@/types';

interface HasSortKey {
  readonly sortKey: string;
}

type ObservableBoolFilter = BoolFilter<Stream, ObservableValueNode>;

@AppComponent({
  components: {
    BackBtn,
    ObservableItem,
    AddObservableDialog,
    EditObservableDialog,
    FilterInfo,
    InputWithChips,
    NoConnectionIcon,
    SearchFilter
  }
})
export default class Observables extends Mixins(RefsForwarding) {
  private addDialogShown = false;
  private editDialogShown = false;

  private editableStream: string = '';

  private filter: string = '';
  private showFilterInput: boolean = false;
  private booleanFilter: ObservableBoolFilter | null = null;
  private readonly filterType = ObservableValueNode;

  private get FilterApplied() {
    return this.showFilterInput;
  }

  private get Observables() {
    return this.App.observables
      .filter((x: Stream) => !this.booleanFilter || this.booleanFilter.Test(x))
      .map((x: Stream) => ({ ...x, sortKey: this.SortKey(x.uri) }))
      .sort((a: HasSortKey, b: HasSortKey) => a.sortKey < b.sortKey ? -1 : +1);
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
  }

  private RemoveFilter() {
    this.filter = '';
    this.booleanFilter = null;
    this.showFilterInput = false;
  }

  private UpdateFilterInstance(instance: ObservableBoolFilter) {
    this.booleanFilter = instance;
  }

  private FilterValidationError(msg: string) {
    this.booleanFilter = null;
    this.$notification.Show(msg, NotificationType.ERR);
  }
}
</script>