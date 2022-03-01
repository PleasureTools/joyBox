<template>
  <v-app class="fill-height" light id="app">
    <v-content class="fill-height">
      <keep-alive include="Archive">
        <router-view></router-view>
      </keep-alive>
      <GetAccessDialog />
      <ClipProgressPopup v-if="HasClipsInProgress" :clipsProgress="ClipsProgress" />
    </v-content>
  </v-app>
</template>

<style scoped>
#app {
  font-family: "Roboto", sans-serif;
}
</style>

<script lang="ts">
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Component, Mixins, Vue, Watch } from 'vue-property-decorator';
import { Route } from 'vue-router';
import { mapState } from 'vuex';

import ClipProgressPopup from '@/Components/ClipProgressPopup.vue';
import GetAccessDialog from '@/Components/GetAccessDialog.vue';
import RefsForwarding from '@/Mixins/RefsForwarding';
import Services from '@/Mixins/Services';
import { AppAccessType, NotificationType } from '@Shared/Types';

@Component({
  components: {
    ChartDataLabels,
    GetAccessDialog,
    ClipProgressPopup
  }
})
export default class App extends Mixins(RefsForwarding, Services) {
  private async CheckWebPush() {
    if (!this.Env.Secure) { return; }

    this.Settings.WebPushAvailable(!!await this.$rpc.GetVAPID());
    const endpoint = await this.Services.push.RetrieveEndpoint();

    if (endpoint.length) {
      this.Settings.WebPushEnabled(await this.$rpc.ValidateEndpoint(endpoint));

      const notifications = await this.$rpc.RetrieveNotifications(endpoint);

      this.Settings.NewRecordNotification(notifications.includes(NotificationType.NewRecord));
      this.Settings.SizeQuotaNotification(notifications.includes(NotificationType.SizeQuota));
    }
  }

  @Watch('App.initialized')
  private async OnInitialize(val: boolean, old: boolean) {
    if (!val) return;

    await this.Access.TryUpgrade();
  }

  @Watch('Access.access')
  private OnAccessChange(val: AppAccessType, old: AppAccessType) {
    if (val === AppAccessType.NO_ACCESS) { this.$router.push('/', () => { }); }

    if (val >= AppAccessType.VIEW_ACCESS) { this.CheckWebPush(); }
  }

  private get HasClipsInProgress() {
    return this.ClipsProgress.length > 0;
  }

  private get ClipsProgress() {
    return this.App.clipProgress;
  }
}
</script>
