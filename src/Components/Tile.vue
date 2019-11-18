<template>
  <v-card :to="href" elevation="3" tile>
    <v-card-title class="headline font-weight-medium justify-center">{{ title }}</v-card-title>
    <v-card-text class="px-0 content">
      <slot></slot>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.content {
  text-align: center;
  padding: 15px;
}
</style>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class Tile extends Vue {
  @Prop() private title!: string;
  @Prop() private href!: string;
}
</script>