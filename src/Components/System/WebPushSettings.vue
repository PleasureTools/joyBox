<template>
  <v-card class="WebPush">
    <v-switch
      label="New record available"
      :disabled="!Settings.webPushAvailable"
      v-model="NewRecordNotificationEnabled"
      :loading="newRecordNotification.inProgress"
      @change="ToggleNewRecordNotification">
      </v-switch>
      <v-switch
      label="Disk space quota"
      :disabled="!Settings.webPushAvailable"
      v-model="SizeQuotaNotificationEnabled"
      :loading="sizeQuotaNotification.inProgress"
      @change="ToggleSizeQuotaNotification">
      </v-switch>
  </v-card>
</template>

<style scoped>
.WebPush {
  padding: 10px;
}
</style>

<script lang="ts">
import { Component, Mixins, Vue } from 'vue-property-decorator';

import RefsForwarding from '@/Mixins/RefsForwarding';
import Services from '@/Mixins/Services';
import { NotificationType } from '@Shared/Types';

interface NotificationControl {
  inProgress: boolean;
  SetState?: (x: boolean) => void;
}

@Component
export default class WebPushSettings extends Mixins(RefsForwarding, Services) {
  private newRecordNotification: NotificationControl = { inProgress: false };
  private sizeQuotaNotification: NotificationControl = { inProgress: false };

  private get NewRecordNotificationEnabled() { return this.Settings.newRecordNotification; }
  private set NewRecordNotificationEnabled(val: boolean) { this.Settings.NewRecordNotification(val); }

  private get SizeQuotaNotificationEnabled() { return this.Settings.sizeQuotaNotification; }
  private set SizeQuotaNotificationEnabled(val: boolean) { this.Settings.SizeQuotaNotification(val); }

  public created(): void {
    this.newRecordNotification.SetState = (x: boolean) => (this.NewRecordNotificationEnabled = x);
    this.sizeQuotaNotification.SetState = (x: boolean) => (this.SizeQuotaNotificationEnabled = x);
  }

  private ToggleNewRecordNotification() {
    this.NewRecordNotificationEnabled ?
      this.EnableNotification(this.newRecordNotification, NotificationType.NewRecord) :
      this.DisableNotification(this.newRecordNotification, NotificationType.NewRecord);
  }

  private ToggleSizeQuotaNotification() {
    this.SizeQuotaNotificationEnabled ?
      this.EnableNotification(this.sizeQuotaNotification, NotificationType.SizeQuota) :
      this.DisableNotification(this.sizeQuotaNotification, NotificationType.SizeQuota);
  }

  private async EnableNotification(controller: NotificationControl, notification: NotificationType): Promise<void> {
    controller.inProgress = true;

    const endpoint = await this.Services.push.RetrieveEndpoint();

    if (!(endpoint.length && await this.$rpc.AddNotification(endpoint, notification))) {
      this.Subscribe(notification);
    }

    controller.SetState?.(true);

    controller.inProgress = false;
  }

  private async DisableNotification(controller: NotificationControl, notification: NotificationType): Promise<void> {
    controller.inProgress = true;

    const endpoint = await this.Services.push.RetrieveEndpoint();
    await this.$rpc.RemoveNotification(endpoint, notification);

    controller.SetState?.(false);

    controller.inProgress = false;
  }

  private async Subscribe(notification: NotificationType) {
    const VAPID: string = await this.$rpc.GetVAPID() as string;
    const subscription = await this.Services.push.Subscribe(VAPID);
    if (subscription) {
      await this.$rpc.SendSubscription(subscription, notification);
    }

    return subscription !== null;
  }
}
</script>
