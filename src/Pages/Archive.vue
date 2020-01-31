<template>
  <div id="Archive.vue" class="fill-height d-flex flex-column">
    <v-app-bar class="flex-grow-0" color="primary">
      <v-btn icon to="/">
        <v-icon>arrow_back</v-icon>
      </v-btn>
      <v-toolbar-title>Archive</v-toolbar-title>
      <v-spacer></v-spacer>
      <NoConnectionIcon />
      <v-btn icon>
        <v-icon v-if="showFilterInput" v-on:click="RemoveFilter">mdi-filter-remove</v-icon>
        <v-icon v-else v-on:click="ShowFilterInput">mdi-filter</v-icon>
      </v-btn>
    </v-app-bar>
    <InputWithChips v-model="filter" :chips="tokens" v-if="showFilterInput"></InputWithChips>
    <v-container class="container" v-if="HasRecords">
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
          <ArchiveRowWrapper class="item-wrapper" :items="item.data" />
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
import { debounce } from 'debounce';
import { Component, Emit, Mixins, Ref, Vue, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';

import { BoolFilter, ValidationError, ValueNode } from '@/Common';
import { ArchiveValueNode } from '@/Common/BoolFilterTemplates/ArchiveValueNode';
import { ArchiveRowWrapper } from '@/Components/Archive';
import { Chip, default as InputWithChips, Shape } from '@/Components/InputWithChips.vue';
import NoConnectionIcon from '@/Components/NoConnectionIcon.vue';
import { AppThemeColor } from '@/MetaInfo';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { NotificationType } from '@/Store/Notification';
import { FileRecord } from '@/types';
import { ArchiveRecord, ClipProgressState } from '@Shared/Types';

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

@Component({
  name: 'Archive',
  metaInfo() {
    return {
      meta: [
        AppThemeColor(this.$vuetify)
      ]
    };
  },
  components: {
    ArchiveRowWrapper,
    InputWithChips,
    NoConnectionIcon
  }})
export default class Archive extends Mixins(RefsForwarding) {
  private columns = 3;
  private scrollPosition: number = 0;
  private viewportWidth = 0;

  private filter = '';
  private tokens: Chip[] = [];
  private showFilterInput = false;
  private filterDebounce = debounce(() => this.ApplyFilter(), 200);
  private booleanFilter: BoolFilter<ArchiveRecord, ArchiveValueNode> | null = null;
  @Ref() private readonly scroller!: RecycleScroller;
  public mounted() {
    this.UpdateViewportWidth();
    this.UpdateColumnsCount();
  }
  public activated() {
    this.App.UpdateLastTimeArchiveVisit();
    this.scroller && this.scroller.scrollToPosition(this.scrollPosition);
  }
  public beforeRouteLeave(to: Route, from: Route, next: any) {
    if (to.path === '/dashboard')
      this.scrollPosition = 0;

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
  private get ItemHeight() {
    const PREVIEW_ASPECT_RATION = 16 / 9;
    const FOOTER_HEIGHT = 90;
    return this.viewportWidth / this.columns / PREVIEW_ASPECT_RATION + FOOTER_HEIGHT;
  }
  private get HasRecords() {
    return this.Files.length > 0;
  }
  private IsPortrait() {
    return !(window.screen.orientation.angle % 180);
  }
  private UpdateViewportWidth() {
    this.viewportWidth = window.innerWidth;
  }
  private UpdateColumnsCount() {
    this.columns = this.IsPortrait() && window.devicePixelRatio > 1 ? 1 : 3;
  }
  private async ShowFilterInput() {
    this.showFilterInput = true;
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
      if (this.filter) {
        this.booleanFilter = new BoolFilter(ArchiveValueNode, this.filter);
        this.tokens = this.booleanFilter.Tokens
          .map(x => ({
            value: x.value,
            form: x.type ? Shape.ROUND : Shape.RECT,
            color: x.type ? '#ba68c8' : '#ff5722'          }));
      } else {
        this.booleanFilter = null;
        this.tokens = [];
      }
    } catch (e) {
      if (e instanceof ValidationError) {
        this.tokens = [{ value: 'Invalid expression', form: Shape.RECT, color: '#e53935' }];
        this.Notification.Show({ message: e.Format(), type: NotificationType.ERR });
      }
    }
  }
}
</script>