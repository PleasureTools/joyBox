<template>
  <v-dialog v-model="Show" width="500">
    <v-card>
      <v-card-title class="title font-weight-medium justify-center">Get Access</v-card-title>
      <v-card-text>
        <v-form onsubmit="return false;">
          <v-text-field
            ref="psw"
            v-model="passphrase"
            :type="pShow ? 'text' : 'password'"
            @click:append="pShow = !pShow"
            :append-icon="pShow ? 'mdi-eye' : 'mdi-eye-off'"
          />
          <v-btn @click="GrantAccess" type="submit">Set</v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import {
  Component,
  Emit,
  Mixins,
  Model,
  Prop,
  Provide,
  Ref,
  Vue,
  Watch
} from 'vue-property-decorator';

import RefsForwarding from '@/Mixins/RefsForwarding';
import { NotificationType } from '@/Plugins/Notifications/Types';

@Component
export default class GetAccessDialog extends Mixins(RefsForwarding) {
  private passphrase: string = '';
  private pShow = false;
  @Ref('psw') private psw!: HTMLInputElement;

  private async GrantAccess() {
    if (this.passphrase.length === 0) {
      return;
    }
    const accessToken = await this.$rpc.GenerateAccessToken(this.passphrase);
    if (accessToken.length) {
      this.Access.SetAccessToken(accessToken);
      if (await this.$rpc.UpgradeAccess(accessToken)) {
        this.Access.GrantFullAccess();
        this.$notification.Show('Access granted');
      } else {
        this.$notification.Show('Invalid token', NotificationType.ERR);
      }
    } else {
      this.$notification.Show('Wrong passphrase', NotificationType.ERR);
    }
    this.Access.CloseDlg();
  }

  @Watch('Access.dialogShown')
  private async OnShow(val: boolean, old: boolean) {
    if (val) {
      this.passphrase = '';
      await this.$nextTick();
      this.psw.focus();
    }
  }
  private get Show() { return this.Access.dialogShown; }
  private set Show(val: boolean) { val ? this.Access.ShowDlg() : this.Access.CloseDlg(); }
}
</script>