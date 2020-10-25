<template>
  <RecycleScroller :items="items" :item-size="itemHeight">
    <template v-slot="{ item, index: idx }">
      <div class="d-flex">
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
        <div @click="OnClick(item)" class="fixed-height" :class="{ unfocused: IsUnfocused(item) }">
          <slot :item="item"></slot>
        </div>
      </div>
    </template>
  </RecycleScroller>
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
.fixed-height {
  white-space: nowrap;
}
</style>

<script lang="ts">
import { Component, Mixins, Prop, Ref, Vue, Watch } from 'vue-property-decorator';

import MountedEmitter from '@/Mixins/MountedEmitter';
import { GraphBuilder } from './GraphBuilder';
import { GroupListItem } from './Types';

enum GroupSegmenType { EMPTY, CROSS, BETWEEN, BOTTOM, TOP, SINGLE }
type TrackQuery = (idx: number, group: number) => GroupSegmenType;
@Component
export default class GroupList<T> extends Mixins(MountedEmitter) {
  @Prop({ required: true }) private readonly items!: Array<GroupListItem<T>>;
  @Prop({ required: true }) private readonly itemHeight!: number;
  private rb!: GraphBuilder<T>;
  private selected: GroupListItem<T> | null = null;
  private get Groups() {
    this.rb = new GraphBuilder(this.items);
    const ret: TrackQuery[] = [];
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
    return ['#29b6f6', '#d50000', '#5e35b1', '#e64a19', '#43a047', '#455a64', '#1565c0', '#cddc39'][group % 8];
  }
  private OnClick(target: GroupListItem<T>) {
    this.selected = this.selected && this.selected.group === target.group ?
      null :
      target;
  }
  private IsUnfocused(item: GroupListItem<T>) {
    return this.selected && item.group !== this.selected.group;
  }
}
</script>