<template>
  <v-card>
    <v-card-text>
      <v-text-field
        label="Remote selenium"
        :value="RemoteSeleniumUrl"
        @input="OnChangeRemoteSeleniumUrl($event)"
        :append-icon="RemoteSeleniumUrlChanged ? 'mdi-content-save' : ''"
        @click:append="UpdateRemoteSeleniumUrl"
      ></v-text-field>
    </v-card-text>
  </v-card>
</template>
<style scoped>
</style>
<script lang="ts">
import { Component, Mixins, Vue } from 'vue-property-decorator';

import Initialized from '@/Mixins/Initialized';
import RefsForwarding from '@/Mixins/RefsForwarding';

@Component
export default class ProxySettings extends Mixins(RefsForwarding, Initialized) {
  private remoteSeleniumUrl = '';

  public Initialized() {
    this.remoteSeleniumUrl = this.Settings.remoteSeleniumUrl;
  }

  get RemoteSeleniumUrl() { return this.Settings.remoteSeleniumUrl; }

  get RemoteSeleniumUrlChanged() {
    return this.Settings.remoteSeleniumUrl !== this.remoteSeleniumUrl;
  }

  public OnChangeRemoteSeleniumUrl(url: string) {
    this.remoteSeleniumUrl = url;
  }

  public UpdateRemoteSeleniumUrl() {
    this.$rpc.SetRemoteSeleniumUrl(this.remoteSeleniumUrl);
    this.$notification.Show('Saved');
  }
}
</script>
