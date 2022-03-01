<template>
  <span>{{ Value }}</span>
</template>

<script lang="ts">
import fd from 'format-duration';

import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

enum TimerMode { Adjustment, Countdown }

@Component
export default class CountdownTimer extends Vue {
  private updateTimer = 0;
  private displayedValue = 0;
  private mode = TimerMode.Countdown;
  private readonly adjustmentTime = 1000;
  private readonly adjustmentSteps = 10;
  @Prop({ required: true }) private readonly value!: number;
  public mounted(): void {
    this.displayedValue = this.value;
    this.Schedule();
  }

  public destroyed(): void {
    clearInterval(this.updateTimer);
  }

  @Watch('value')
  private OnValueChanged(val: number, old: number) {
    clearInterval(this.updateTimer);
    this.mode = TimerMode.Adjustment;
    this.Schedule();
  }

  private Schedule() {
    switch (this.mode) {
      case TimerMode.Countdown:
        this.updateTimer = setInterval(() => this.OnCountDown(), 1000);
        break;
      case TimerMode.Adjustment:
        this.updateTimer = setInterval(() => this.OnAdjust(), this.adjustmentTime / this.adjustmentSteps);
        break;
      default:
        throw new Error('Unknown mode');
    }
  }

  private OnCountDown() {
    if (this.displayedValue > 0) { --this.displayedValue; }
  }

  private OnAdjust() {
    const step = Math.round((this.value - this.displayedValue) / this.adjustmentSteps);
    const nextValue = this.displayedValue + step;
    if (step === 0 || (step > 0 && nextValue > this.value) || (step < 0 && nextValue < this.value)) {
      this.displayedValue = this.value;
      this.mode = TimerMode.Countdown;
      clearInterval(this.updateTimer);
      this.Schedule();
      return;
    }

    this.displayedValue += step;
  }

  private get Value() {
    return fd(this.displayedValue * 1000);
  }
}
</script>
