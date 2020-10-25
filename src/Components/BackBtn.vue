<template>
  <v-btn icon @click="OnClick">
    <v-icon>arrow_back</v-icon>
  </v-btn>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class BackBtn extends Vue {
  @Prop({ required: false })
  public readonly to: string | undefined;
  private OnClick() {
    this.to ? this.$router.push({ path: this.to }) : this.$router.go(-1);
  }
}
</script>