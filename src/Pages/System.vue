<template>
  <div>
    <v-app-bar app color="primary">
      <v-btn icon to="/">
        <v-icon>arrow_back</v-icon>
      </v-btn>
      <v-toolbar-title>System</v-toolbar-title>
      <v-spacer></v-spacer>
      <NoConnectionIcon />
    </v-app-bar>
    <v-container grid-list-sm fluid>
      <v-row>
        <v-col cols="12" sm="6">
          <PluginManager />
        </v-col>
        <v-col cols="12" sm="6">
          <WebPushSettings />
        </v-col>
        <v-col cols="12" sm="6">
          <v-card class="danger-zone">
            <v-btn class="system-btn" @click="Shutdown" :disabled="!App.connected" color="#e53935">Shutdown</v-btn>
            <v-btn
              class="system-btn"
              @click="DanglinngRecordsButton"
              :disabled="!App.connected"
              :color="DanglingDanger"
            >{{ danglingBtnCaption }}</v-btn>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.danger-zone {
  padding: 10px;
  border: 2px solid #ff5252;
}
.system-btn {
  margin: 3px;
}
</style>

<script lang="ts">
import prettyBytes from 'pretty-bytes';
import { Component, Mixins, Vue } from 'vue-property-decorator';
import draggable from 'vuedraggable';

import NoConnectionIcon from '@/Components/NoConnectionIcon.vue';
import { PluginManager, WebPushSettings } from '@/Components/System';
import { AppThemeColor } from '@/MetaInfo';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { NotificationType } from '@/Store/Notification';
import { Plugin } from '@/types';

@Component({
  metaInfo() {
    return {
      meta: [
        AppThemeColor(this.$vuetify)
      ]
    };
  },
  components: {
    NoConnectionIcon,
    PluginManager,
    WebPushSettings
  }
})
export default class System extends Mixins(RefsForwarding) {
  private readonly DANGLING_BTN_DEFAULT = 'Find dangling records';
  private danglingBtnMode = true;
  private danglingBtnCaption = this.DANGLING_BTN_DEFAULT;
  private get DanglingDanger() {
    return this.danglingBtnMode ? '#ffffff' : '#e53935';
  }

  private Shutdown() {
    this.$rpc.Shutdown();
  }

  private async DanglinngRecordsButton() {
    if (this.danglingBtnMode ? await this.ShowDanglingSummary() : await this.RemoveDanglingRecords() || true)
      this.danglingBtnMode = !this.danglingBtnMode;
  }

  private async ShowDanglingSummary() {
    const summary = await this.$rpc.DanglingRecordsSummary();
    summary.count ?
      this.danglingBtnCaption = `${summary.count} records - ${prettyBytes(summary.size)}. Clean?` :
      this.Notification.Show({ message: 'Nothing to clean.', type: NotificationType.INFO });
    return summary.count > 0;
  }

  private async RemoveDanglingRecords() {
    const ret = await this.$rpc.RemoveDanglingRecords();
    ret === 0 ?
      this.Notification.Show({ message: 'Cleaned.', type: NotificationType.INFO }) :
      this.Notification.Show({ message: `Can\'t delete ${ret} items.`, type: NotificationType.ERR });
    this.danglingBtnCaption = this.DANGLING_BTN_DEFAULT;
    return ret;
  }
}
</script>