<template>
  <v-app class="fill-height" light id="app">
    <v-content class="fill-height">
      <keep-alive include="Archive">
        <router-view></router-view>
      </keep-alive>
      <GetAccessDialog />
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

import GetAccessDialog from '@/Components/GetAccessDialog.vue';
import RefsForwarding from '@/Mixins/RefsForwarding';
import Services from '@/Mixins/Services';
import { AppAccessType } from '@Shared/Types';

@Component({ components: { ChartDataLabels, GetAccessDialog } })
export default class App extends Mixins(RefsForwarding, Services) {
  private async CheckWebPush() {
    if (!this.Env.Secure)
      return;

    this.Settings.WebPushAvailable(!!await this.$rpc.GetVAPID());
    const endpoint = await this.Services.push.RetrieveEndpoint();

    endpoint && this.Settings.WebPushEnabled(await this.$rpc.ValidateEndpoint(endpoint));
  }
  @Watch('App.initialized')
  private async OnInitialize(val: boolean, old: boolean) {
    if (!val) return;

    await this.Access.TryUpgrade();
  }
  @Watch('Access.access')
  private OnAccessChange(val: AppAccessType, old: AppAccessType) {
    if (val === AppAccessType.NO_ACCESS)
      this.$router.push('/', () => { });

    if (val >= AppAccessType.VIEW_ACCESS)
      this.CheckWebPush();
  }
}
</script>
