<template>
  <v-dialog :value="model" @input="Close" width="500">
    <v-card>
      <v-card-title class="title font-weight-medium justify-center">{{
        title
      }}</v-card-title>
      <v-card-text>
        <v-form onsubmit="return false;">
          <v-text-field v-model="inputTitle" label="Title" />
          <v-text-field v-model="inputSource" label="Source" />
          <v-text-field v-model="inputNewFilename" label="Rename" />

          <v-btn @click="Apply()" type="submit">Apply</v-btn>
          <v-btn @click="Close(false)">Cancel</v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
</style>

<script lang="ts">
import { NotificationType } from '@/Plugins/Notifications/Types';
import { Component, Emit, Model, Prop, Vue, Watch } from 'vue-property-decorator';

@Component
export default class EditDialog extends Vue {
  @Model('show')
  private model!: boolean;

  @Emit('show')
  private Close(show: boolean = false) { }

  @Prop({ required: true })
  private title!: string;

  @Prop({ required: true })
  private filename!: string;

  private inputTitle = '';
  private inputSource = '';
  private inputNewFilename = '';

  @Watch('model')
  public OnShowChange(val: boolean, prev: boolean) {
    if (val)
      this.inputNewFilename = this.filename;
  }

  public async Apply() {
    if (await this.$rpc.LinkVideo(this.filename, this.inputTitle, this.inputSource, this.inputNewFilename)) {
      this.Close();
      this.$notification.Show('Linked');
    } else {
      this.$notification.Show('Failed to link', NotificationType.ERR);
    }
  }
}
</script>