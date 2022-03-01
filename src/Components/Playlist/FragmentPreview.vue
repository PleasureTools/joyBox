<template>
<v-card>
    <v-img :src="segment.record.thumbnail" :aspect-ratio="16/9" />
    <v-range-slider :min="0" :max="segment.record.duration" :value="SegmentRange" step="0.01" @change="SegmentRangeChange" class="range-selector"></v-range-slider>
     <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn @click="Remove(position)" icon>
        <v-icon>mdi-delete</v-icon>
      </v-btn>
      {{ segment.loop }}
      <v-menu offset-y>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
        icon
        v-bind="attrs"
        v-on="on">
          <v-icon>mdi-reload</v-icon>
        </v-btn>
      </template>
      <LoopMenu :value="segment.loop" @loop="OnMenuItem" />
    </v-menu>
    </v-card-actions>
</v-card>
</template>

<style scoped>
.range-selector {
  position: relative;
  margin-bottom: -46px;
  margin-top: -7px;
}
</style>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';

import { SerializedFileRecord as FileRecord } from '@Shared/Types';
import LoopMenu, { LoopEvent, LoopValueType } from './LoopMenu.vue';

export interface Segment {
  record: FileRecord;
  begin: number;
  end: number;
  loop: number;
}

@Component({
  components: {
    LoopMenu
  }
})
export default class FragmentPreview extends Vue {
  @Prop({ required: true })
  private readonly segment!: Segment;

  @Prop({ required: true })
  private readonly position!: number;

  @Emit('remove')
  private Remove(position: number) { }

  @Emit('loop')
  private Loop(position: number, e: LoopEvent) { }

  private OnMenuItem(e: LoopEvent) {
    this.Loop(this.position, e);
  }

  private get SegmentRange() {
    return [this.segment.begin, this.segment.end];
  }

  private SegmentRangeChange(val: number[]) {
    [this.segment.begin, this.segment.end] = val;
  }
}
</script>
