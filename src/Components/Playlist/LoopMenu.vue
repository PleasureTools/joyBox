<template>
<v-list>
    <v-list-item-group>
      <v-list-item @click="Add(1)">
        <v-list-item-content>
          <v-list-item-title>+1</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item @click="Add(-1)" :disabled="DecrementDisabled">
        <v-list-item-content>
          <v-list-item-title>-1</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list-item-group>
  </v-list>
</template>

<style scoped>
</style>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';

export enum LoopValueType { Add, Set }

export interface LoopEvent {
  type: LoopValueType;
  value: number;
}

@Component
export default class LoopMenu extends Vue {
  @Prop({ required: true })
  private readonly value!: number;

  @Emit('loop')
  private Loop(e: LoopEvent) {}

  private Add(value: number) {
    this.Loop({ type: LoopValueType.Add, value });
  }

  private get DecrementDisabled() {
    return this.value <= 1;
  }
}
</script>
