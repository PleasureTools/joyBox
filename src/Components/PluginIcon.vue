<template>
  <img v-if="valid" :src="IconFilename" />
  <v-icon v-else>block</v-icon>
</template>
<style scoped>
.asset-holder {
  background-image: "~@/assets/plugins/dummy.png";
}
</style>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
@Component
export default class PluginIcon extends Vue {
  @Prop({ required: true }) private readonly name!: string;
  private valid = true;
  private get IconFilename() {
    try {
      return require(`@/assets/plugins/${this.name}.png`);
    } catch (e) {
      this.valid = false;
    }
  }
}
</script>