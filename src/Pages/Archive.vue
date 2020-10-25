<template>
  <div id="Archive.vue" class="fill-height d-flex flex-column">
    <v-app-bar class="flex-grow-0" color="primary">
      <BackBtn />
      <v-toolbar-title>Archive</v-toolbar-title>
      <v-spacer></v-spacer>
      <NoConnectionIcon />
      <v-btn icon>
        <v-icon v-if="showFilterInput" @click="ClearFilter">mdi-filter-remove</v-icon>
        <v-icon v-else @click="ShowFilterInput">mdi-filter</v-icon>
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
    <v-container fluid class="container" v-if="HasRecords">
      <div class="wrapper">
        <RecycleScroller
          ref="scroller"
          class="scroller fill-height"
          :items="RowItems"
          :item-size="ItemHeight"
          emitUpdate
          @update="OnScroll"
          emitResize
          @resize="OnResize"
          v-slot="{ item }"
        >
          <RowWrapper class="item-wrapper" :items="item.data" :cols="Cols" />
        </RecycleScroller>
      </div>
    </v-container>
    <p v-else class="text-center font-weight-bold display-3 blue-grey--text text--lighten-4">No data</p>
  </div>
</template>
<style scoped>
.container {
  position: relative;
  flex: 100% 1 1;
}
.wrapper {
  position: absolute;
  overflow: hidden;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
.scroller {
  width: 100%;
  height: 100%;
}
.item-wrapper {
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
import { AppComponent } from '@/Common/Decorators/AppComponent';
import FilterInfo from '@/Components/Archive/FilterInfo.vue';
import RowWrapper from '@/Components/Archive/RowWrapper.vue';
import BackBtn from '@/Components/BackBtn.vue';
import { Chip, default as InputWithChips, Shape } from '@/Components/InputWithChips.vue';
import NoConnectionIcon from '@/Components/NoConnectionIcon.vue';
import SearchFilter from '@/Components/SearchFilter/SearchFilter.vue';
import { filterBySource } from '@/EventBusTypes';
import EventBus from '@/Mixins/EventBus';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { NotificationType } from '@/Plugins/Notifications/Types';
import {
  ClipProgressState,
  SerializedArchiveRecord as ArchiveRecord,
  SerializedFileRecord as FileRecord
} from '@Shared/Types';

interface RecycleScroller {
  $el: HTMLElement;
  scrollToPosition(position: number): void;
}
interface RecycleScrollerItem {
  id: string;
  type: string;
}
type RecucleScrollerFile = FileRecord & RecycleScrollerItem;
type RecucleScrollerProgress = ClipProgressState & RecycleScrollerItem;
type ArchiveBoolFilter = BoolFilter<ArchiveRecord, ArchiveValueNode>;

@AppComponent({
  name: 'Archive',
  components: {
    BackBtn,
    FilterInfo,
    RowWrapper,
    SearchFilter,
    InputWithChips,
    NoConnectionIcon
  }
})
export default class Archive extends Mixins(RefsForwarding, EventBus) {
  private columns = 3;
  private scrollPosition: number = 0;
  private prevScrollPosition = 0;
  private viewportWidth = 0;

  private filter = '';
  private showFilterInput = false;
  private booleanFilter: BoolFilter<ArchiveRecord, ArchiveValueNode> | null = null;
  private filterBySourceUnsub!: () => void;
  @Ref() private readonly scroller!: RecycleScroller;
  private readonly filterType = ArchiveValueNode;

  public mounted() {
    this.UpdateViewportWidth();
    this.UpdateColumnsCount();

    this.filterBySourceUnsub = this.EventBus.subscribe(filterBySource, e => {
      this.filter = 'source:' + e.payload.source;
      this.showFilterInput = true;
      this.prevScrollPosition = this.scrollPosition;
    });
  }

  public destroyed() {
    this.filterBySourceUnsub();
  }

  public activated() {
    this.App.UpdateLastTimeArchiveVisit();
    this.scroller && this.scroller.scrollToPosition(this.scrollPosition);
  }
  /**
   * Because the archive component is cached, it will remember the scroll position.
   * This behavior is only necessary in a case, when returns from the record viewing page
   * (/archive -> /player/record -> /archive).
   */
  public beforeRouteLeave(to: Route, from: Route, next: any) {
    if (!(to.path.startsWith('/player') || to.path.startsWith('/clip'))) {
      this.scrollPosition = 0;

      this.filter = '';
      this.booleanFilter = null;
      this.showFilterInput = false;
    }

    next();
  }

  private OnScroll(start: number, end: number) {
    this.scrollPosition = this.scroller.$el.scrollTop;
  }

  private OnResize() {
    this.UpdateViewportWidth();
    this.UpdateColumnsCount();
  }

  private ThumbnailFromFilename(filename: string) {
    return `${this.Env.Origin}/archive/thumbnail/${filename.slice(0, filename.lastIndexOf('.'))}.jpg`;
  }

  private get Files(): FileRecord[] {
    return this.App.RecordsByNewest
      .filter((x: ArchiveRecord) => !this.booleanFilter || this.booleanFilter.Test(x))
      .map((x: ArchiveRecord) => ({ ...x, thumbnail: this.ThumbnailFromFilename(x.filename) }));
  }

  private get Items(): Array<RecucleScrollerFile | RecucleScrollerProgress> {
    return [
      ...this.App.clipProgress.map(x => ({ ...x, id: x.label, type: 'clip' })),
      ...this.Files.map(x => ({ ...x, id: x.filename, type: 'record' }))];
  }

  private get RowItems() {
    const ret = [];
    let i = 0;
    const Id = () => this.Items[i].type === 'clip' ?
      (this.Items[i] as RecucleScrollerProgress).label :
      (this.Items[i] as RecucleScrollerFile).filename;

    for (; i < this.Items.length; i += this.columns)
      ret.push({ id: Id(), data: this.Items.slice(i, i + this.columns) });

    if (i < this.Items.length)
      ret.push({ id: Id(), data: this.Items.slice(i) });

    return ret;
  }

  private get Cols() { return Math.round(12 / this.columns); }

  private get ItemHeight() {
    const PREVIEW_ASPECT_RATION = 16 / 9;
    const FOOTER_HEIGHT = 90;
    return this.viewportWidth / this.columns / PREVIEW_ASPECT_RATION + FOOTER_HEIGHT;
  }

  private get HasRecords() {
    return this.Files.length > 0;
  }

  private IsPortrait() {
    return window.screen.width < window.screen.height;
  }

  private UpdateViewportWidth() {
    this.viewportWidth = window.innerWidth;
  }

  private UpdateColumnsCount() {
    this.columns = this.IsPortrait() ? 1 : 3;
  }

  private async ShowFilterInput() {
    this.showFilterInput = true;
  }

  private ClearFilter() {
    this.filter = '';
    this.booleanFilter = null;
    this.showFilterInput = false;
  }

  private async UpdateFilterInstance(instance: ArchiveBoolFilter) {
    if (!instance) {
      await this.$nextTick();
      this.scroller?.scrollToPosition(this.prevScrollPosition);
    }

    this.booleanFilter = instance;
  }

  private FilterValidationError(msg: string) {
    this.booleanFilter = null;
    this.$notification.Show(msg, NotificationType.ERR);
  }
}
</script>