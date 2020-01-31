<!-- 
    Shows text when focused or chips when not focused.
 -->
<template>
  <div>
    <v-chip-group v-if="!focused" class="chips">
      <v-chip :label="IsRectForm(chip)" v-for="(chip, idx) in chips" :key="chip.value + idx" :color="chip.color">{{ chip.value }}</v-chip>
    </v-chip-group>
    <v-text-field
      ref="input"
      :value="InnerText"
      @input="$emit('input', $event)"
      @focus="Focus(true)"
      @blur="Focus(false)"
    ></v-text-field>
  </div>
</template>

<style scoped>
.chips {
  position: absolute;
}
</style>

<script lang="ts">
import { Component, Model, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
export enum Shape { ROUND, RECT }
export interface Chip {
  value: string;
  form: Shape;
  color: string;
}

@Component
export default class Observables extends Vue {
  @Model('input') private readonly text!: string;
  @Prop({ required: true }) private readonly chips!: Chip[];
  @Ref('input') private inputRef!: HTMLInputElement;
  private focused: boolean = false;
  private get InnerText() { return this.focused ? this.text : ''; }
  public async mounted() {
    await this.$nextTick();
    this.inputRef.focus();
  }
  private Focus(val: boolean) { this.focused = val; }
  private IsRectForm(chip: Chip) {
    return chip.form === Shape.RECT;
  }
}
</script>