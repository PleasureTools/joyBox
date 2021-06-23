<template>
  <div>
    <EditDialog v-model="editDialogModel" :filename="filename" title="Link" />
    <v-list v-if="untrackedVideos.length">
      <v-list-item v-for="v in untrackedVideos" :key="v.filename">
        <v-list-item-content>
          {{ v.filename }}
        </v-list-item-content>
        <v-btn icon :to="PlayerPath(v.filename)"
          ><v-icon>mdi-play</v-icon></v-btn
        >
        <v-btn icon @click="LinkVideo(v.filename)"
          ><v-icon>mdi-link</v-icon></v-btn
        >
      </v-list-item>
    </v-list>
    <p v-else class="text-center font-weight-bold display-3 blue-grey--text text--lighten-4">No data</p>
  </div>
</template>

<style scoped>
</style>

<script lang="ts">
import { UntrackedVideo } from '@/types';
import { Component, Vue } from 'vue-property-decorator';

import EditDialog from './EditDialog.vue';

@Component({
  components:
  {
    EditDialog
  }
})
export default class Archive extends Vue {
  private untrackedVideos: UntrackedVideo[] = [];
  private refreshTimer = -1;
  private editDialogModel = false;
  private filename = '';

  public mounted() {
    this.refreshTimer = setInterval(() => this.FetchUntrackedVideos(), 5000);
    this.FetchUntrackedVideos();
  }

  public destroyed() {
    clearInterval(this.refreshTimer);
  }

  public async FetchUntrackedVideos() {
    this.untrackedVideos = await this.$rpc.FindUntrackedVideos();
  }

  public PlayerPath(filename: string) {
    return `/player/${filename}`;
  }

  public LinkVideo(filename: string) {
    this.filename = filename;
    this.editDialogModel = true;
  }
}
</script>