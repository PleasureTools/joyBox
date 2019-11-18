<template>
  <v-card class="WebPush">
    <v-switch
      label="Push Notifications"
      v-model="WebPushEnabled"
      :loading="enableWebPushInProgress"
      @change="ToggleWebPush"
    ></v-switch>
  </v-card>
</template>

<style scoped>
.WebPush {
  padding: 10px;
}
</style>

<script lang="ts">
import { Component, Mixins, Vue } from 'vue-property-decorator';

import * as Push from '@/Common/PushNotification';
import RefsForwarding from '@/Mixins/RefsForwarding';

@Component
export default class WebPushSettings extends Mixins(RefsForwarding) {
  private enableWebPushInProgress = false;
  private get WebPushEnabled() { return this.Settings.webPushEnabled; }
  private set WebPushEnabled(val: boolean) { this.Settings.WebPushEnabled(val); }
  private async ToggleWebPush() {
    this.Settings.webPushEnabled ? this.EnableWebPush() : this.DisableWebPush();
  }
  private async EnableWebPush() {
    this.enableWebPushInProgress = true;
    try {
      const VAPID: string = await this.$rpc.GetVAPID() as string;
      const subscription = await Push.Subscribe(VAPID);

      if (!subscription) {
        this.enableWebPushInProgress = false;
        this.Settings.webPushEnabled = false;
        return;
      }

      await this.$rpc.SendSubscription(subscription);
    } catch (e) {
      this.Settings.webPushEnabled = false;
    }
    this.enableWebPushInProgress = false;
  }

  private DisableWebPush() {
    Push.Unsubscribe();
  }
}
</script>