<template>
  <div>
    <v-app-bar app color="primary">
      <v-btn icon to="/system">
        <v-icon>arrow_back</v-icon>
      </v-btn>
      <v-toolbar-title>Analytics</v-toolbar-title>
      <v-spacer></v-spacer>
      <NoConnectionIcon />
    </v-app-bar>
    <v-tabs>
      <v-tab to="space_usage">Space usage</v-tab>
      <v-tab to="archive_population">Archive population</v-tab>
    </v-tabs>
    <router-view></router-view>
  </div>
</template>

<style scoped>
</style>

<script lang="ts">
import { Emit, Mixins, Model, Prop, Vue } from 'vue-property-decorator';

import { AppComponent } from '@/Common/Decorators/AppComponent';
import NoConnectionIcon from '@/Components/NoConnectionIcon.vue';

@AppComponent({
  components: {
    NoConnectionIcon
  }
})
export default class Analytics extends Vue { }
</script>