<template>
  <span>{{ Value }}</span>
</template>

<script lang="ts">
import 'reflect-metadata';

import prettyMs from 'pretty-ms';
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class TimeAgo extends Vue {
  @Prop({ required: true }) private readonly value!: number;

  private now: number = 0;
  private renderTimer: number = 0;

  public mounted() {
    this.UpdateNow();
    this.renderTimer = setInterval(() => this.UpdateNow(), 10000);
  }

  public destroyed() {
    clearInterval(this.renderTimer);
  }

  private get Value() {
    return prettyMs(Math.max(this.now - this.value * 1000, 0), { compact: true }).substr(1) + ' ago';
  }

  private UpdateNow() {
    this.now = Date.now();
  }
}
</script>