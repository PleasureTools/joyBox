<template>
  <span>{{ Value }}</span>
</template>

<script lang="ts">
import prettyMs from 'pretty-ms';
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class TimeAgo extends Vue {
  @Prop() public value!: number;

  private now: number = 0;
  private renderTimer: number = 0;

  public mounted() {
    this.UpdateNow();
    this.renderTimer = setInterval(() => this.UpdateNow(), 10000);
  }

  public destroyed() {
    clearInterval(this.renderTimer);
  }

  public get Value() {
    return prettyMs(this.now - this.value * 1000, { compact: true }).substr(1) + ' ago';
  }

  private UpdateNow() {
    this.now = Date.now();
  }
}
</script>