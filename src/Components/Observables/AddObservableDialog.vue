<template>
  <v-dialog :value="show" @input="Close" width="500">
    <v-card>
      <v-card-title class="title font-weight-medium justify-center">Add observable</v-card-title>
      <v-card-text>
        <v-form onSubmit="return false;">
          <v-text-field ref="url" v-model="inputUrl" />
          <v-btn v-on:click="Add()" type="submit">Add</v-btn>
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
export default class AddObservableDialog extends Mixins(RefsForwarding) {
  private inputUrl: string = '';

  @Model('change') private show: boolean = false;
  @Ref('url') private url!: HTMLInputElement;
  @Emit() private Change(show: boolean) { }

  private Close() {
    this.Change(false);
  }

  private async Add() {
    if (this.inputUrl.length === 0) {
      return;
    }

    try {
      const ret = await this.$rpc.AddObservable(this.inputUrl);
      this.Notification.Show({ message: ret.reason, type: ret.result ? NotificationType.INFO : NotificationType.ERR });
    } catch (e) {
      console.log('METHOD CALL TIMEOUT');
    }

    this.Close();
  }

  @Watch('show')
  private async OnShow(val: boolean, old: boolean) {
    if (val) {
      this.inputUrl = '';
      await this.$nextTick();
      this.url.focus();
    }
  }
}
</script>