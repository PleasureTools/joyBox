<template>
  <v-list class="resource-list font-weight-black">
    <ImproveAccessDialog v-model="improveAccessDialogShown" />
    <v-list-item v-if="!App.FullAccess" class="improve-access">
      <v-btn icon @click.prevent="ImproveAccess">
        <v-icon>mdi-login</v-icon>
      </v-btn>
    </v-list-item>
    <v-list-item>
      <v-list-item-title class="resource text-left">Backend</v-list-item-title>
      <v-list-item-subtitle class="text-left">
        <span class="status" v-bind:class="[App.connected ? 'online': 'offline']"></span>
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
      <v-list-item-title class="resource text-left">Used space</v-list-item-title>
      <v-list-item-subtitle class="text-left">
        <span class="value">{{ Hdd }}</span>
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
.value {
  font-size: 1.2em;
}
</style>

<script lang="ts">
import prettyBytes from 'pretty-bytes';
import prettyMs from 'pretty-ms';
import { Component, Mixins, Vue, Watch } from 'vue-property-decorator';

import RefsForwarding from '@/Mixins/RefsForwarding';
import { RecordInfo } from '@/types';
import ImproveAccessDialog from '../ImproveAccessDialog.vue';

@Component({
  components: {
    ImproveAccessDialog
  }
})
export default class System extends Mixins(RefsForwarding) {
private tm: number = 0;
  private uptimeTimer: number = 0;

  private improveAccessDialogShown = false;
  public mounted() {
    if (this.App.connected)
      this.RenderUptime();
  }

  public destroyed() {
    clearInterval(this.uptimeTimer);
  }
  public ImproveAccess() {
    this.improveAccessDialogShown = true;
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
    return prettyBytes(this.SystemResources.hdd);
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