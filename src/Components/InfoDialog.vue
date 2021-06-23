<template>
  <v-dialog :value="show" @input="EmitShow" width="500">
    <v-card>
      <slot name="info"></slot>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="CloseInfo">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Emit, Model, Vue } from 'vue-property-decorator';

@Component
export default class InfoDialog extends Vue {
  @Model()
  private show = false;

  @Emit('show')
  private EmitShow(show: boolean) { }

  private CloseInfo() { this.EmitShow(false); }
}
</script>