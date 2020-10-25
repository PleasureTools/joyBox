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
    <v-card-text class="text-center">{{ Duration(clip.duration) }}</v-card-text>
    <v-card-text class="text-center">
      <CountdownTimer :value="clip.eta" />
    </v-card-text>
  </v-card>
</template>

<style scoped>
.container {
  height: 100%;
}
</style>

<script lang="ts">
import 'reflect-metadata';

import fd from 'format-duration';
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';

import CountdownTimer from '@/Components/CountdownTimer.vue';
import { ClipProgressState } from '@Shared/Types';

@Component({
  components: {
    CountdownTimer
  }
})
export default class ClipProgressCard extends Vue {
  @Prop({ required: true }) private readonly clip!: ClipProgressState;

  private Duration(duration: number) {
    return fd(duration * 1000);
  }
}
</script>