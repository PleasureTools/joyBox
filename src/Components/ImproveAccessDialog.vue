<template>
  <v-dialog :value="show" @input="Close" width="500">
    <v-card>
      <v-card-title class="title font-weight-medium justify-center">Improve access</v-card-title>
      <v-card-text>
        <v-form onsubmit="return false;">
          <v-text-field
            ref="psw"
            v-model="passphrase"
            :type="pShow ? 'text' : 'password'"
            @click:append="pShow = !pShow"
            :append-icon="pShow ? 'mdi-eye' : 'mdi-eye-off'"
          />
          <v-btn v-on:click="Improve" type="submit">Set</v-btn>
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
import { NotificationType } from '@/Store/Notification';

@Component
export default class ImproveAccessDialog extends Mixins(RefsForwarding) {
  private passphrase: string = '';
  private pShow = false;
  @Model('change') private readonly show: boolean = false;
  @Ref('psw') private psw!: HTMLInputElement;
  @Emit() private Change(show: boolean) { }

  private Close() {
    this.Change(false);
  }

  private async Improve() {
    if (this.passphrase.length === 0) {
      return;
    }

    try {
      if (await this.$rpc.ImproveAccess(this.passphrase)) {
        this.App.SetPassphrase(this.passphrase);
        this.App.GrandFullAccess();
        this.Notification.Show({ message: 'Access granted' });
      } else {
        this.Notification.Show({ message: 'Wrong passphrase', type: NotificationType.ERR });
      }
    } catch (e) {
      console.log('METHOD CALL TIMEOUT');
    }

    this.Close();
  }

  @Watch('show')
  private async OnShow(val: boolean, old: boolean) {
    if (val) {
      this.passphrase = '';
      await this.$nextTick();
      this.psw.focus();
    }
  }
}
</script>