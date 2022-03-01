<template>
  <div id="Archive.vue" class="fill-height d-flex flex-column">
    <v-app-bar class="flex-grow-0" color="primary">
      <BackBtn to="/" />
      <v-toolbar-title>Archive</v-toolbar-title>
      <v-spacer></v-spacer>
      <NoConnectionIcon />
      <v-btn icon>
        <v-icon v-if="showFilterInput" @click="ClearFilter">mdi-filter-remove</v-icon>
        <v-icon v-else @click="ShowFilterInput">mdi-filter</v-icon>
      </v-btn>
    </v-app-bar>
    <RecordsView
    v-model="filter"
    :showFilterInput="showFilterInput"
    @init="CaptureScroller"
    @view-scroll="OnScroll"
    class="view">
      <template v-slot="{items, cols}">
        <RowWrapper :items="items" :cols="cols" class="row">
          <template v-slot="{file}">
            <RecordCard :file="file" />
          </template>
        </RowWrapper>
      </template>
  </RecordsView>
  </div>
</template>

<style scoped>
.row {
  margin: 0;
}
</style>

<script lang="ts">
import { interval, Subject, Subscription } from 'rxjs';
import { debounce } from 'rxjs/operators';
import { Emit, Mixins, Ref, Vue, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';

import { BoolFilter, ValidationError, ValueNode } from '@/Common';
import { ArchiveValueNode } from '@/Common/BoolFilterTemplates/ArchiveValueNode';
import { PlaylistValueNode } from '@/Common/BoolFilterTemplates/PlaylistValueNode';
import { AppComponent } from '@/Common/Decorators/AppComponent';
import FilterInfo from '@/Components/Archive/FilterInfo.vue';
import RecordCard from '@/Components/Archive/RecordCard.vue';
import RowWrapper from '@/Components/Archive/RowWrapper.vue';
import BackBtn from '@/Components/BackBtn.vue';
import InputWithChips, { Chip, Shape } from '@/Components/InputWithChips.vue';
import NoConnectionIcon from '@/Components/NoConnectionIcon.vue';
import SearchFilter from '@/Components/SearchFilter/SearchFilter.vue';
import { filterBySource } from '@/EventBusTypes';
import EventBus from '@/Mixins/EventBus';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { NotificationType } from '@/Plugins/Notifications/Types';
import {
  ClipProgressState,
  Filter,
  Playlist,
  SerializedArchiveRecord as ArchiveRecord,
  SerializedFileRecord as FileRecord
} from '@Shared/Types';
import { ThumbnailFromFilename } from '../Common/ThumbnailFromFilename';
import RecordsView, { RecycleScroller } from '../Components/Archive/RecordsView.vue';

interface RecycleScrollerItem {
  id: string;
  type: string;
}
type RecucleScrollerFile = FileRecord & RecycleScrollerItem;
type RecucleScrollerProgress = ClipProgressState & RecycleScrollerItem;
type RecucleScrollerPlaylist = Playlist & RecycleScrollerItem;
type ArchiveBoolFilter = BoolFilter<ArchiveRecord, ArchiveValueNode>;

@AppComponent({
  name: 'Archive',
  components: {
    BackBtn,
    FilterInfo,
    RecordsView,
    RecordCard,
    RowWrapper,
    SearchFilter,
    InputWithChips,
    NoConnectionIcon
  }
})
export default class Archive extends Mixins(RefsForwarding, EventBus) {
  private scrollPosition = 0;

  private filter = '';
  private showFilterInput = false;
  private filterBySourceUnsub!: () => void;
  private readonly filterType = ArchiveValueNode;
  private scroller?: RecycleScroller;

  public mounted(): void {
    this.filterBySourceUnsub = this.EventBus.subscribe(filterBySource, e => {
      this.filter = 'source:' + e.payload.source;
      this.showFilterInput = true;
    });
  }

  public destroyed(): void {
    this.filterBySourceUnsub();
  }

  public activated(): void {
    this.App.UpdateLastTimeArchiveVisit();
    this.scroller?.scrollToPosition(this.scrollPosition);
  }

  public deactivated(): void {
    this.App.UpdateLastTimeArchiveVisit();
  }

  /**
   * Because the archive component is cached, it will remember the scroll position.
   * This behavior is only necessary in a case, when returns from the record viewing page
   * (/archive -> /player/record -> /archive).
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  public beforeRouteLeave(to: Route, from: Route, next: any): void {
    if (!(to.path.startsWith('/player') || to.path.startsWith('/clip'))) {
      this.scrollPosition = 0;

      this.filter = '';
      this.showFilterInput = false;
    }

    next();
  }

  private OnScroll(position: number) {
    this.scrollPosition = position;
  }

  private IsPortrait() {
    return window.screen.width < window.screen.height;
  }

  private async ShowFilterInput() {
    this.showFilterInput = true;
  }

  private ClearFilter() {
    this.filter = '';
    this.showFilterInput = false;
  }

  private CaptureScroller(scroller: RecycleScroller) {
    this.scroller = scroller;
  }
}
</script>
