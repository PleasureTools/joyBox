<template>
  <div>
    <v-app-bar app color="primary">
      <BackBtn to="/" />
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
          <Quotas />
        </v-col>
        <v-col cols="12" sm="6">
          <ProxySettings />
        </v-col>
        <v-col cols="12" sm="6">
          <v-card class="danger-zone">
            <v-btn
              class="system-btn"
              @click="Shutdown"
              :disabled="!(App.connected && Access.FullAccess)"
              color="#e53935"
              >Shutdown</v-btn
            >
            <v-btn
              class="system-btn"
              @click="DanglinngRecordsButton"
              :disabled="!(App.connected && Access.FullAccess)"
              :color="DanglingDanger"
              >{{ danglingBtnCaption }}</v-btn
            >
          </v-card>
        </v-col>
        <v-col cols="12" sm="6">
          <v-card>
            <div class="tools">
              <v-btn to="/log" class="tool-btn">Log</v-btn>
              <v-btn to="/analytics" class="tool-btn">Analytics</v-btn>
              <v-btn to="/upload_video" class="tool-btn">Upload video</v-btn>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6">
          <v-card>
            <v-card-text>Build: {{ Window.build }}</v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.tools {
  flex-wrap: wrap;
  padding-bottom: 4px;
}
.tool-btn {
 margin: 8px 0 4px 8px;
}
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
import { Mixins, Vue } from 'vue-property-decorator';
import draggable from 'vuedraggable';

import { AppComponent } from '@/Common/Decorators/AppComponent';
import BackBtn from '@/Components/BackBtn.vue';
import NoConnectionIcon from '@/Components/NoConnectionIcon.vue';
import { PluginManager, WebPushSettings } from '@/Components/System';
import ProxySettings from '@/Components/System/ProxySettings.vue';
import Quotas from '@/Components/System/Quotas.vue';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { NotificationType } from '@/Plugins/Notifications/Types';
import { Plugin } from '@/types';

@AppComponent({
  components: {
  BackBtn,
  Quotas,
  NoConnectionIcon,
  PluginManager,
  WebPushSettings,
  ProxySettings
  }
  })
export default class System extends Mixins(RefsForwarding) {
  private readonly DANGLING_BTN_DEFAULT = 'Find dangling records';
  private danglingBtnMode = true;
  private danglingBtnCaption = this.DANGLING_BTN_DEFAULT;
  private get DanglingDanger() {
    return this.danglingBtnMode ? '#ffffff' : '#e53935';
  }

  private async Shutdown() {
    if (await this.$confirm.Show('Shutdown?')) { this.$rpc.Shutdown(); }
  }

  private async DanglinngRecordsButton() {
    if (this.danglingBtnMode ? await this.ShowDanglingSummary() : await this.RemoveDanglingRecords() || true) {
      this.danglingBtnMode = !this.danglingBtnMode;
    }
  }

  private async ShowDanglingSummary() {
    const summary = await this.$rpc.DanglingRecordsSummary();
    summary.count ?
      this.danglingBtnCaption = `${summary.count} records - ${prettyBytes(summary.size)}. Clean?` :
      this.$notification.Show('Nothing to clean.', NotificationType.INFO);
    return summary.count > 0;
  }

  private async RemoveDanglingRecords() {
    const ret = await this.$rpc.RemoveDanglingRecords();
    ret === 0 ?
      this.$notification.Show('Cleaned.', NotificationType.INFO) :
      this.$notification.Show(`Can't delete ${ret} items.`, NotificationType.ERR);
    this.danglingBtnCaption = this.DANGLING_BTN_DEFAULT;
    return ret;
  }

  private get Window() { return window; }
}
</script>
