<template>
    <div class="component">
        <SearchFilter
        :nodeType="filterType"
        :preparedQueries="App.archiveFilters"
        :value="filter"
        @input="SearchFilterInput"
        @updateInstance="UpdateFilterInstance"
        @validationError="FilterValidationError"
        @save="SaveFilter"
        @remove="RemoveFilter"
        v-if="showFilterInput">
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
              v-slot="{ item }">
                  <slot :items="item.data" :cols="Cols" />
              </RecycleScroller>
          </div>
        </v-container>
        <p v-else class="text-center font-weight-bold display-3 blue-grey--text text--lighten-4">
            No data
        </p>
    </div>
</template>

<style scoped>
.component {
  display: flex;
  flex-direction: column;
  position: relative;
  flex: 1 1 100%;
  background-color: white;
}
.container {
  position: relative;
  flex: 1 1 100%;
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
import { Component, Emit, Mixins, Model, Prop, Ref, Vue, Watch } from 'vue-property-decorator';

import { BoolFilter, ValidationError, ValueNode } from '@/Common';
import { ArchiveValueNode } from '@/Common/BoolFilterTemplates/ArchiveValueNode';
import { PlaylistValueNode } from '@/Common/BoolFilterTemplates/PlaylistValueNode';
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
import { Merge } from '@Shared/Util';
import { ThumbnailFromFilename } from '../../Common/ThumbnailFromFilename';
import SearchFilter from '../SearchFilter/SearchFilter.vue';
import FilterInfo from './FilterInfo.vue';

export interface RecycleScroller {
  $el: HTMLElement;
  scrollToPosition(position: number): void;
}
interface RecycleScrollerItem {
  id: string;
  type: string;
}
type RecucleScrollerFile = FileRecord & RecycleScrollerItem;
type RecucleScrollerProgress = ClipProgressState & RecycleScrollerItem;
type RecucleScrollerPlaylist = Playlist & RecycleScrollerItem;
type ArchiveBoolFilter = BoolFilter<ArchiveRecord, ArchiveValueNode>;

interface TimestampTrait {
  timestamp: number;
}

@Component({
  components: {
    FilterInfo,
    SearchFilter
  }
})
export default class RecordsView extends Mixins(RefsForwarding, EventBus) {
  @Model('update_filter')
  private readonly filter!: string;

  @Emit('update_filter')
  private UpdateFilter(val: string) {}

  @Emit('view-scroll')
  private ViewScroll(position: number) {}

  @Emit('init')
  private Init(scroller: RecycleScroller) {}

  @Prop({ required: false, default: false })
  private readonly showFilterInput!: boolean;

  @Ref()
  private readonly scroller!: RecycleScroller;

  private columns = 3;

  private prevScrollPosition = 0;

  private viewportWidth = 0;

  private booleanFilter: BoolFilter<ArchiveRecord, ArchiveValueNode> | null = null;

  private filterBySourceUnsub!: () => void;
  private readonly filterType = ArchiveValueNode;

  public mounted(): void {
    this.UpdateViewportWidth();
    this.UpdateColumnsCount();

    this.Init(this.scroller);
  }

  private OnResize() {
    this.UpdateViewportWidth();
    this.UpdateColumnsCount();
  }

  private get Cols() { return Math.round(12 / this.columns); }

  private async UpdateFilterInstance(instance: ArchiveBoolFilter) {
    if (instance && !this.booleanFilter) {
      this.prevScrollPosition = this.scroller.$el.scrollTop;
    }

    if (instance) {
      this.scroller?.scrollToPosition(0);
    } else {
      this.booleanFilter = instance;
      await this.$nextTick();
      this.scroller?.scrollToPosition(this.prevScrollPosition);
      return;
    }

    this.booleanFilter = instance;
  }

  private FilterValidationError(msg: string) {
    this.booleanFilter = null;
    this.$notification.Show(msg, NotificationType.ERR);
  }

  private UpdateViewportWidth() {
    this.viewportWidth = window.innerWidth;
  }

  private UpdateColumnsCount() {
    this.columns = this.IsPortrait() ? 1 : 3;
  }

  private IsPortrait() {
    return window.screen.width < window.screen.height;
  }

  private get ItemHeight() {
    const PREVIEW_ASPECT_RATION = 16 / 9;
    const FOOTER_HEIGHT = 90;
    return this.viewportWidth / this.columns / PREVIEW_ASPECT_RATION + FOOTER_HEIGHT;
  }

  private get RowItems() {
    const ret = [];
    let i = 0;
    const Id = () => this.Items[i].type === 'clip' ?
      (this.Items[i] as RecucleScrollerProgress).label :
      this.Items[i].type === 'playlist' ?
        (this.Items[i] as RecucleScrollerPlaylist).id :
        (this.Items[i] as RecucleScrollerFile).filename;

    for (; i < this.Items.length; i += this.columns) {
      ret.push({ id: Id(), data: this.Items.slice(i, i + this.columns) });
    }

    if (i < this.Items.length) { ret.push({ id: Id(), data: this.Items.slice(i) }); }

    return ret;
  }

  private get Files(): FileRecord[] {
    return this.App.RecordsByNewest
      .filter((x: ArchiveRecord) => !this.booleanFilter || this.booleanFilter.Test(x))
      .map((x: ArchiveRecord) => ({ ...x, thumbnail: ThumbnailFromFilename(x.filename) }));
  }

  private get Playlists(): Playlist[] {
    return this.App.PlaylistsByNewest
      .filter((x: Playlist) => !this.booleanFilter)
      .map((x: Playlist) => ({ ...x, thumbnail: ThumbnailFromFilename(x.segments[0].filename) }));
  }

  private static TimestampComparator<T extends TimestampTrait>(l: T, r: T): boolean {
    return r.timestamp < l.timestamp;
  }

  private get Items(): Array<RecucleScrollerFile | RecucleScrollerProgress | RecycleScrollerItem> {
    return Merge<TimestampTrait>(RecordsView.TimestampComparator,
      this.Playlists.map(x => ({ pid: x.id, ...x, id: `playlist_${x.id}`, type: 'playlist' })),
      this.Files.map(x => ({ ...x, id: x.filename, type: 'record' }))) as
      unknown as RecucleScrollerProgress[] | RecycleScrollerItem[];
  }

  private get HasRecords() {
    return this.Items.length > 0;
  }

  private OnScroll(start: number, end: number) {
    this.ViewScroll(this.scroller.$el.scrollTop);
  }

  private async SaveFilter(name: string) {
    if (await this.$rpc.AddArchiveFilter(name, this.filter)) {
      this.$notification.Show('Saved', NotificationType.INFO);
    } else {
      this.$notification.Show('Failed to save filter', NotificationType.ERR);
    }
  }

  private RemoveFilter(filter: Filter) {
    this.$rpc.RemoveArchiveFilter(filter.id);
  }

  private SearchFilterInput(value: string) {
    this.UpdateFilter(value);
  }
}
</script>
