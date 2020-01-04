<template>
  <v-btn @pointerdown="OnHold" @pointerup="OnRelease" @pointerout="OnCancel" icon>
    <slot></slot>
  </v-btn>
</template>


<script lang="ts">
import 'reflect-metadata';

import { Component, Emit, Prop, Vue } from 'vue-property-decorator';

@Component
export default class LongPressButton extends Vue {
  private holdTimestamp = 0;
  private updateTimer: number = 0;

  @Prop({ default: 2000 }) private readonly holdTime!: number;
  @Prop({ default: 5 }) private readonly steps!: number;

  @Emit() private longpress() { }
  @Emit() private update(val: number) { }
  @Emit() private cancel() { }

  private get OnHoldMode() {
    return this.holdTimestamp !== 0;
  }

  private OnHold() {
    this.holdTimestamp = Date.now();
    this.updateTimer = setInterval(() => this.OnUpdate(), this.holdTime / this.steps);
  }

  private OnRelease() {
    if (this.OnHoldMode && Date.now() - this.holdTimestamp >= this.holdTime)
      this.longpress();
    else
      this.cancel();

    this.Reset();
  }

  private OnCancel() {
    if (this.OnHoldMode) {
      this.Reset();
      this.cancel();
    }
  }

  private OnUpdate() {
    this.update(Math.min((Date.now() - this.holdTimestamp), this.holdTime) / this.holdTime * 100);
  }

  private Reset() {
    this.holdTimestamp = 0;
    clearInterval(this.updateTimer);
  }
}
</script>