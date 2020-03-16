<template>
  <v-app class="fill-height" light id="app">
    <v-content class="fill-height">
      <keep-alive include="Archive">
        <router-view></router-view>
      </keep-alive>
      <v-snackbar :timeout="3000" vertical v-model="NotificationVisibility">
        <div>{{ Notification.message }}</div>
        <div :style="{ backgroundColor: NotificationColor}" class="notification-type"></div>
      </v-snackbar>
    </v-content>
  </v-app>
</template>

<style scoped>
#app {
  font-family: "Roboto", sans-serif;
}
.notification-type {
  position: relative;
  bottom: -8px;
  height: 3px;
  margin: 0 -16px;
}
</style>

<script lang="ts">
import { Component, Mixins, Vue, Watch } from 'vue-property-decorator';
import { mapState } from 'vuex';

import { RetrieveEndpoint } from '@/Common';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { AppAccessType } from '@Shared/Types';
import { NotificationType } from './Store/Notification';

@Component
export default class App extends Mixins(RefsForwarding) {
  private get NotificationVisibility() { return this.Notification.visible; }
  private set NotificationVisibility(val: boolean) { this.Notification.SetVisible(val); }
  private async CheckWebPush() {
    if (!this.Env.Secure)
      return;

    this.Settings.WebPushAvailable(!!await this.$rpc.GetVAPID());
    const endpoint = await RetrieveEndpoint();

    endpoint && this.Settings.WebPushEnabled(await this.$rpc.ValidateEndpoint(endpoint));
  }
  private get NotificationColor() {
    const theme = (this.$vuetify.theme as any).currentTheme;
    return [theme.info, theme.warning, theme.error][this.Notification.type];
  }
  private async TryUpgradeConnection() {
    await this.$rpc.UpgradeAccess(this.App.accessToken) ?
      this.App.GrandFullAccess() :
      this.App.InvalidateToken();
  }
  @Watch('App.initialized')
  private async OnInitialize(val: boolean, old: boolean) {
    if (!val) return;

    if (!this.App.NoAccess)
      this.CheckWebPush();

    if (this.App.HasAccessToken)
      await this.TryUpgradeConnection();

    if (this.App.NoAccess) {
      this.$router.push('/', () => { });
    }

    const newRecords = this.App.archive
      .filter(x => x.timestamp > this.App.lastTimeArchiveVisit);
    if (newRecords.length === 1) {
      this.Notification.Show({ message: `New record in archive from source: ${newRecords[0].source}.` });
    } else if (newRecords.length > 0)
      if (newRecords.every(x => x.source === newRecords[0].source))
        this.Notification.Show({
          message: `New ${newRecords.length} records in archive from source: ${newRecords[0].source}`
        });
      else
        this.Notification.Show({ message: `New ${newRecords.length} records in archive.` });
  }
  @Watch('App.access')
  private OnAccessChange(val: AppAccessType, old: AppAccessType) {
    if (val >= AppAccessType.VIEW_ACCESS)
      this.CheckWebPush();
  }
}
</script>
