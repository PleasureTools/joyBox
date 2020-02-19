<template>
  <div>
    <div v-for="(item, idx) in items" :key="item.id" class="d-flex">
      <div v-for="(group, groupIdx) in Groups" :key="group.color">
        <div v-if="Empty(group(idx, item.group))" class="track"></div>
        <div v-else-if="Cross(group(idx, item.group))" class="track">
          <div class="cross cross-full" :style="{ backgroundColor: Color(idx, groupIdx)}"></div>
        </div>
        <div v-else-if="Between(group(idx, item.group))" class="track">
          <div class="cross cross-full" :style="{ backgroundColor: Color(idx, groupIdx)}"></div>
          <div class="circle" :style="{ backgroundColor: Color(idx, groupIdx)}"></div>
        </div>
        <div v-else-if="Bottom(group(idx, item.group))" class="track">
          <div class="cross cross-bottom" :style="{ backgroundColor: Color(idx, groupIdx)}"></div>
          <div class="circle" :style="{ backgroundColor: Color(idx, groupIdx)}"></div>
        </div>
        <div v-else-if="Top(group(idx, item.group))" class="track">
          <div class="cross cross-top" :style="{ backgroundColor: Color(idx, groupIdx)}"></div>
          <div class="circle" :style="{ backgroundColor: Color(idx, groupIdx)}"></div>
        </div>
        <div v-else-if="Single(group(idx, item.group))" class="track">
          <div class="circle" :style="{ backgroundColor: Color(idx, groupIdx)}"></div>
        </div>
      </div>
      <div @click="OnClick(item)" :class="{ unfocused: IsUnfocused(item) }">
        <slot :item="item"></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.unfocused {
  color: #adadad;
}
.track {
  position: relative;
  display: flex;
  width: 10px;
  height: 100%;
  flex-direction: column;
  justify-content: center;
}
.cross {
  position: absolute;
  width: 2px;
  left: 4px;
}
.cross-full {
  height: 100%;
}
.cross-top {
  height: 50%;
  top: 50%;
}
.cross-bottom {
  height: 50%;
  bottom: 50%;
}
.circle {
  position: relative;
  display: inline-block;
  left: 2px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
</style>

<script lang="ts">
import { gt } from 'binary-search-bounds';
import IntervalTree from 'node-interval-tree';
import { Component, Mixins, Prop, Ref, Vue, Watch } from 'vue-property-decorator';

enum GroupSegmenType { EMPTY, CROSS, BETWEEN, BOTTOM, TOP, SINGLE }

type GroupId = number;
interface Range {
  start: number;
  stop: number;
}
interface RangeNode extends Range {
  group: number;
  track: number;
}
class GraphBuilder {
  private static RangesByStartComp(l: Range, r: Range) {
    return l.start - r.start;
  }
  private readonly rangesMap = new Map<GroupId, Range>();
  private trackCount: number = 0;
  private lookupTable: RangeNode[] = [];
  private repository = new IntervalTree<RangeNode>();
  public constructor(private items: GroupListItem[]) {
    this.BuildRanges();
    this.BuildTracks();
    this.PopulateRepository();
  }
  public get TrackCount() {
    return this.trackCount;
  }
  public Query(idx: number, track: number) {
    return this.repository
      .search(idx, idx)
      .find(x => x.track === track) || null;
  }
  private BuildRanges() {
    this.items.forEach((x, i) => {
      const range = this.rangesMap.get(x.group);
      if (range) {
        range.stop = i;
      } else {
        const newRange: Range = { start: i, stop: i };
        this.rangesMap.set(x.group, newRange);
      }
    });
  }
  private BuildTracks() {
    this.lookupTable = [...this.rangesMap.entries()].map(x => ({ ...x[1], group: x[0], track: -1 }));
    this.lookupTable.sort(GraphBuilder.RangesByStartComp);

    const localLookup = [...this.lookupTable];

    for (let i = 0; i < localLookup.length; ++i, ++this.trackCount) {
      localLookup[i].track = this.trackCount;

      const needle: Range = { start: localLookup[i].stop, stop: -1 };
      while (true) {
        const foundIdx: number = gt(localLookup, needle, GraphBuilder.RangesByStartComp);

        if (foundIdx === -1 || foundIdx >= localLookup.length) break;

        localLookup[foundIdx].track = this.trackCount;
        needle.start = localLookup[foundIdx].stop;

        localLookup.splice(foundIdx, 1);
      }

    }
  }
  private PopulateRepository() {
    this.lookupTable.forEach(x => this.repository.insert(x.start, x.stop, x));
  }
}

export interface GroupListItem {
  id: number;
  group: number;
  data: any;
}

@Component
export default class GroupList extends Vue {
  @Prop({ required: true }) private readonly items!: GroupListItem[];
  private rb!: GraphBuilder;
  private selected: GroupListItem | null = null;
  private get Groups() {
    this.rb = new GraphBuilder(this.items);
    const ret: any[] = [];
    for (let i = 0; i < this.rb.TrackCount; ++i) {
      ret.push((idx: number, group: number) => {
        const qr = this.rb.Query(idx, i);

        if (!qr || idx > qr.stop || idx < qr.start)
          return GroupSegmenType.EMPTY;
        else if (qr.start === qr.stop)
          return GroupSegmenType.SINGLE;
        else if (idx === qr.start)
          return GroupSegmenType.TOP;
        else if (idx === qr.stop)
          return GroupSegmenType.BOTTOM;
        else if (i === qr.track && qr.group === group)
          return GroupSegmenType.BETWEEN;
        else
          return GroupSegmenType.CROSS;
      });
    }
    return ret;
  }
  private Color(idx: number, group: number) {
    const qr = this.rb.Query(idx, group);
    return this.GroupToColor(qr && qr.group || 0);
  }
  private Empty(type: GroupSegmenType) {
    return type === GroupSegmenType.EMPTY;
  }
  private Cross(type: GroupSegmenType) {
    return type === GroupSegmenType.CROSS;
  }
  private Between(type: GroupSegmenType) {
    return type === GroupSegmenType.BETWEEN;
  }
  private Bottom(type: GroupSegmenType) {
    return type === GroupSegmenType.BOTTOM;
  }
  private Top(type: GroupSegmenType) {
    return type === GroupSegmenType.TOP;
  }
  private Single(type: GroupSegmenType) {
    return type === GroupSegmenType.SINGLE;
  }
  private GroupToColor(group: number) {
    return ['#B71C1C', '#4A148C', '#1565C0', '#43A047', '#CDDC39', '#E65100'][group % 6];
  }
  private OnClick(target: GroupListItem) {
    this.selected = this.selected && this.selected.group === target.group ?
      null :
      target;
  }
  private IsUnfocused(item: GroupListItem) {
    return this.selected && item.group !== this.selected.group;
  }
}
</script>