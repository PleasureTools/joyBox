<template>
  <v-list class="resource-list font-weight-black">
    <v-list-item v-if="!Access.FullAccess" class="improve-access">
      <v-btn icon @click.prevent="Access.ShowDlg">
        <v-icon>mdi-login</v-icon>
      </v-btn>
    </v-list-item>
    <v-list-item>
      <v-list-item-title class="resource text-left">Backend</v-list-item-title>
      <v-list-item-subtitle class="text-left">
        <span
          class="status"
          :class="[App.connected ? 'online' : 'offline']"
        ></span>
      </v-list-item-subtitle>
    </v-list-item>
    <v-list-item>
      <v-list-item-title class="resource text-left">Uptime</v-list-item-title>
      <v-list-item-subtitle class="text-left">
        <span class="value">{{ Uptime }}</span>
      </v-list-item-subtitle>
    </v-list-item>
    <v-list-item>
      <v-list-item-title class="resource text-left">CPU</v-list-item-title>
      <v-list-item-subtitle class="text-left">
        <span class="value">{{ Cpu }}</span>
      </v-list-item-subtitle>
    </v-list-item>
    <v-list-item>
      <v-list-item-title class="resource text-left">Memory</v-list-item-title>
      <v-list-item-subtitle class="text-left">
        <span class="value">{{ Rss }}</span>
      </v-list-item-subtitle>
    </v-list-item>
    <v-list-item>
      <v-list-item-title class="resource text-left">Network</v-list-item-title>
      <v-list-item-subtitle class="text-left">
        <span class="value">{{ NetworkUtilization }}</span>
      </v-list-item-subtitle>
    </v-list-item>
    <v-list-item>
      <v-list-item-title class="resource text-left"
        >Used space</v-list-item-title
      >
      <v-list-item-subtitle class="text-left value-break">
        <span class="value">{{ Hdd }}</span>
        <span v-if="IsDetailedHdd" class="value">{{ DetailedHdd }}</span>
      </v-list-item-subtitle>
    </v-list-item>
  </v-list>
</template>

<style scoped>
.improve-access {
  position: absolute;
  right: 0;
  top: 9px;
}
.online {
  background-color: #76ff03;
}
.offline {
  background-color: #e53935;
}
.status {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  display: inline-block;
}
.resource-list {
  margin: 0 25px;
}
.resource {
  font-size: 1.2em;
}
.value-break {
  white-space: pre-wrap;
}
.value {
  display: inline-block;
  font-size: 1.2em;
}
</style>

<script lang="ts">
import prettyBytes from 'pretty-bytes';
import prettyMs from 'pretty-ms';
import { Component, Mixins, Vue, Watch } from 'vue-property-decorator';

import RefsForwarding from '@/Mixins/RefsForwarding';

@Component
export default class System extends Mixins(RefsForwarding) {
  private tm: number = 0;
  private uptimeTimer: number = 0;
  public mounted() {
    if (this.App.connected)
      this.RenderUptime();
  }
  public destroyed() {
    clearInterval(this.uptimeTimer);
  }
  private get Uptime() {
    return this.App.connected ?
      prettyMs(Math.max(this.tm - this.App.startTime, 0), { secondsDecimalDigits: 0 }) :
      0;
  }
  private get NetworkUtilization() {
    return prettyBytes(this.App.NetworkUtilization) + '/s';
  }
  private get Cpu() {
    return this.SystemResources.cpu + '%';
  }
  private get Rss() {
    return prettyBytes(this.SystemResources.rss);
  }
  private get Hdd() {
    return prettyBytes(this.App.ArchiveSize + this.App.ActiveRecordingsSize);
  }

  private get ArchiveSize() {
    return prettyBytes(this.App.ArchiveSize);
  }

  private get ActiveRecordingsSize() {
    return prettyBytes(this.App.ActiveRecordingsSize);
  }

  private get DetailedHdd() {
    return this.ArchiveSize.slice(-2) === this.ActiveRecordingsSize.slice(-2) ?
      `(${this.ArchiveSize.slice(0, -3)} + ${this.ActiveRecordingsSize.slice(0, -3)})` :
      `(${this.ArchiveSize} + ${this.ActiveRecordingsSize})`;
  }

  private get IsDetailedHdd() {
    return this.App.ActiveRecordingsSize > 0;
  }

  private UpdateTm() {
    this.tm = Date.now();
  }
  private RenderUptime() {
    this.UpdateTm();
    this.uptimeTimer = setInterval(() => this.UpdateTm(), 1000);
  }
  @Watch('App.connected')
  private OnConnectedChange(val: boolean, oldVal: boolean) {
    val ? this.RenderUptime() : clearInterval(this.uptimeTimer);
  }
}
</script>