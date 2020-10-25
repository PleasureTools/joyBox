<template>
  <v-card>
    <v-card-text>
      <v-text-field
        label="Storage quota"
        :value="StorageQuota"
        @input="OnChangeStorageQuota(SizeStrToByte($event))"
        :append-icon="StorageQuotaChanged ? 'mdi-content-save' : ''"
        @click:append="UpdateStorageQuota"
        :rules="[ValidateStorageInput]"
      ></v-text-field>
      <v-text-field
        label="Instance quota"
        :value="InstanceQuota"
        @input="OnChangeInstanceQuota(ToInt($event))"
        :append-icon="InstanceQuotaChanged ? 'mdi-content-save' : ''"
        @click:append="UpdateInstanceQuota"
      ></v-text-field>
      <v-text-field
        label="Download speed quota (KB/s)"
        :value="DownloadSpeedQuota"
        @input="OnChangeDownloadSpeedQuota(DownloadSpeedToByte($event))"
        :append-icon="DownloadSpeedQuotaChanged ? 'mdi-content-save' : ''"
        @click:append="UpdateDownloadSpeedQuota"
      ></v-text-field>
    </v-card-text>
  </v-card>
</template>
<style scoped>
</style>
<script lang="ts">
import prettyBytes from 'pretty-bytes';
import { interval, Subject } from 'rxjs';
import { debounce, map } from 'rxjs/operators';
import { Component, Mixins, Vue } from 'vue-property-decorator';

import Initialized from '@/Mixins/Initialized';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { InputEventSubject } from '@/types';
import { SizeStrToByte, SizeToByteMetric } from '@Shared/Util';

@Component
export default class Limits extends Mixins(RefsForwarding, Initialized) {
  private storageQuota = 0;
  private instanceQuota = 0;
  private downloadSpeedQuota = 0;
  public Initialized() {
    this.storageQuota = this.Settings.storageQuota;
    this.instanceQuota = this.Settings.instanceQuota;
    this.downloadSpeedQuota = this.Settings.downloadSpeedQuota;
  }
  private get StorageQuota() { return prettyBytes(this.Settings.storageQuota); }
  private get StorageQuotaChanged() {
    return !Number.isNaN(this.storageQuota) && this.Settings.storageQuota !== this.storageQuota;
  }
  private get InstanceQuota() { return this.Settings.instanceQuota; }
  private get InstanceQuotaChanged() {
    return !Number.isNaN(this.instanceQuota) && this.Settings.instanceQuota !== this.instanceQuota;
  }
  private get DownloadSpeedQuota() { return prettyBytes(this.Settings.downloadSpeedQuota); }
  private get DownloadSpeedQuotaChanged() {
    return !Number.isNaN(this.downloadSpeedQuota) && this.Settings.downloadSpeedQuota !== this.downloadSpeedQuota;
  }
  private OnChangeStorageQuota(quota: number) {
    this.storageQuota = quota;
  }
  private OnChangeInstanceQuota(quota: number) {
    this.instanceQuota = quota;
  }
  private OnChangeDownloadSpeedQuota(quota: number) {
    this.downloadSpeedQuota = quota;
  }
  private UpdateStorageQuota() {
    this.$rpc.SetStorageQuota(this.storageQuota);
    this.$notification.Show('Saved');
  }
  private UpdateInstanceQuota() {
    this.$rpc.SetInstanceQuota(this.instanceQuota);
    this.$notification.Show('Saved');
  }
  private UpdateDownloadSpeedQuota() {
    this.$rpc.SetDownloadSpeedQuota(this.downloadSpeedQuota);
    this.$notification.Show('Saved');
  }
  private SizeStrToByte(str: string) { return SizeStrToByte(str, SizeToByteMetric.GB); }
  private DownloadSpeedToByte(str: string) { return SizeStrToByte(str, SizeToByteMetric.KB); }
  private ToInt(str: string) { return Number.parseInt(str, 10); }
  private ValidateStorageInput() {
    return Number.isNaN(this.storageQuota) ? 'Valid values: 1 (implies GB), 2GB, 800MB' : true;
  }
}
</script>