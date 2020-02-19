<template>
  <div class="color-line" :style="{ 'background-image': ColorMapToCss, height: HeightToCss }"></div>
</template>

<style scoped>
.color-line {
  width: 100%;
}
</style>

<script lang="ts">
import 'reflect-metadata';

import { Component, Emit, Prop, Vue } from 'vue-property-decorator';

export interface ColorMapItem {
  stop: number;
  color: string;
}

@Component
export default class ColorLine extends Vue {
  @Prop({ default: -1 }) private readonly height!: number;
  @Prop({ required: true }) private readonly colorMap!: ColorMapItem[];

  private get ColorMapToCss() {
    return `linear-gradient(90deg,${this.colorMap.map((x, i) => this.ColorMapItemToStr(i)).join(',')})`;
  }
  private ColorMapItemToStr(index: number) {
    if (index === 0)
      return `${this.colorMap[index].color} 0 ${this.colorMap[index].stop}%`;
    else
      return `${this.colorMap[index].color} ${this.colorMap[index - 1].stop}% ${this.colorMap[index].stop}%`;
  }
  private get HeightToCss() {
    return this.height === -1 ? 'auto' : this.height + 'px';
  }
}
</script>