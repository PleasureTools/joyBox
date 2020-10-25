<template>
  <span>{{ Value }}</span>
</template>

<script lang="ts">
import fd from 'format-duration';

import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

@Component
export default class CountdownTimer extends Vue {
  private updateTimer = 0;
  private innerVal = 0;
  @Prop({ required: true }) private readonly value!: number;
  public mounted() {
    this.Schedule();
  }
  public destroyed() {
    clearInterval(this.updateTimer);
  }
  @Watch('value')
  private OnValueChanged(val: number, old: number) {
    this.innerVal = val;
    clearInterval(this.updateTimer);
    this.Schedule();
  }
  private Schedule() {
    this.updateTimer = setInterval(() => this.OnUpdate(), 1000);
  }
  private OnUpdate() {
    if (this.innerVal > 0)
      --this.innerVal;
  }
  private get Value() {
    return fd(this.innerVal * 1000);
  }
}
</script>