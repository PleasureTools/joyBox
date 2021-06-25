<template>
  <div class="component">
    <v-text-field v-model="title" :disabled="ShowProgress" label="Title"></v-text-field>
    <v-text-field v-model="source" :disabled="ShowProgress" label="source" :placeholder="sourcePlaceholder"></v-text-field>
    <v-file-input v-model="file" :disabled="ShowProgress" accept="video/mp4" show-size></v-file-input>
    <v-progress-linear
      v-if="ShowProgress"
      :value="progress"
    ></v-progress-linear>
    <v-btn @click="Upload" :disabled="UplaodDisabled">Upload</v-btn>
  </div>
</template>

<style scoped>
.component {
  margin: 0 4px;
}
</style>

<script lang="ts">
import FileUplaoder from '@/Common/FileUploader';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { NotificationType } from '@/Plugins/Notifications/Types';
import { Component, Mixins } from 'vue-property-decorator';

@Component
export default class LocalFile extends Mixins(RefsForwarding) {
  private file: File | null = null;
  private progress = 0;
  private uplaoder = new FileUplaoder();
  private title = '';
  private source = '';
  private sourcePlaceholder = 'local';

  public get UplaodDisabled() { return !(!this.ShowProgress && this.file && this.title.length); }

  public get ShowProgress() { return this.progress > 0 && this.progress < 100; }

  public StatusCodeToString(status: number) {
    switch (status) {
      case 401: return 'Unauthorized';
    }

    return 'Unknown error';
  }

  public Upload() {
    this.uplaoder.Upload(this.title, this.source || this.sourcePlaceholder, this.file as File, this.Access.token)
      .subscribe(p => this.progress = p.loaded / p.total * 100,
        err => this.UploadFailed(err),
        () => this.UploadComplete());
  }

  public UploadFailed(err: number) {
    this.$notification.Show(this.StatusCodeToString(err), NotificationType.ERR);
    this.progress = 0;
  }

  public UploadComplete() {
    this.title = '';
    this.source = '';
    this.file = null;

    this.$notification.Show('Uploaded');
  }
}
</script>