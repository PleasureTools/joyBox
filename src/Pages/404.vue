<template>
  <div>
    <v-app-bar app color="primary">
      <v-btn icon to="/">
        <v-icon>arrow_back</v-icon>
      </v-btn>
    </v-app-bar>
    <p
      class="text-center font-weight-bold display-3 blue-grey--text text--lighten-4"
    >Page not found</p>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Vue } from 'vue-property-decorator';

import { AppThemeColor } from '@/MetaInfo';
import RefsForwarding from '@/Mixins/RefsForwarding';

@Component({
  metaInfo() {
    return {
      meta: [
        AppThemeColor(this.$vuetify)
      ]
    };
  }})
export default class PageNotFound extends Mixins(RefsForwarding) { }
</script>