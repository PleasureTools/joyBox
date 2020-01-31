<template>
  <v-card class="container">
    <v-card-title class="justify-center">
      <v-progress-circular
        class="progress text-center"
        :rotate="-90"
        :size="100"
        :width="15"
        :value="clip.progress"
        color="#03a9f4"
      >{{ clip.progress }}</v-progress-circular>
    </v-card-title>
    <v-card-text class="text-center">
      {{ Duration(clip.duration) }}
    </v-card-text>
  </v-card>
</template>

<style scoped>
.container {
  height: 100%;
}
.duration {
  font-size: 4em;
}
</style>

<script lang="ts">
import 'reflect-metadata';

import fd from 'format-duration';
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';

import { ClipProgressState } from '@Shared/Types';

@Component
export default class ClipProgress extends Vue {
  @Prop({ required: true }) private readonly clip!: ClipProgressState;

  private Duration(duration: number) {
    return fd(this.clip.duration * 1000);
  }
}
</script>