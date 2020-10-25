<template>
  <v-dialog @input="change" @keydown.enter="Choose(true)" width="500" value="true">
    <v-card>
      <v-card-title>{{ message }}</v-card-title>
      <v-card-actions>
        <v-btn @click="Choose(true)">OK</v-btn>
        <v-btn @click="Choose(false)">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
</style>

<script lang="ts">
import { Component, Emit, Mixins, Model, Prop, Vue } from 'vue-property-decorator';

@Component
export default class ConfirmDlg extends Vue {
  @Prop()
  public readonly message!: string;
  public value = false;
  private Choose(choose: boolean) {
    this.value = choose;
    this.$destroy();
  }
  private change() {
    this.$destroy();
  }
}
</script>