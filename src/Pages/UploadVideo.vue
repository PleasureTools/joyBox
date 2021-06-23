<template>
  <div>
    <v-app-bar class="flex-grow-0" color="primary">
      <BackBtn to="/system" />
      <v-toolbar-title>Upload video</v-toolbar-title>
      <v-spacer></v-spacer>
      <NoConnectionIcon />
    </v-app-bar>
    <v-tabs>
      <v-tab to="file">Local file</v-tab>
      <v-tab to="url">Url</v-tab>
      <v-tab to="archive">Archive</v-tab>
    </v-tabs>
    <router-view></router-view>
  </div>
</template>

<style scoped>
</style>

<script lang="ts">
import { Component, Emit, Mixins, Model, Prop, Vue } from 'vue-property-decorator';

import { AppComponent } from '@/Common/Decorators/AppComponent';
import BackBtn from '@/Components/BackBtn.vue';
import NoConnectionIcon from '@/Components/NoConnectionIcon.vue';

@AppComponent({
  components: {
    BackBtn,
    NoConnectionIcon
  }
})
export default class UplaodVideo extends Vue {
}
</script>