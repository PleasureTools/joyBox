<!-- 
    Shows text when focused or chips when not focused.
 -->
<template>
  <div class="component">
    <div v-if="!focus" class="chips">
      <span
        v-for="(chip, idx) in chips"
        :class="{ value: IsRectForm(chip), operator: !IsRectForm(chip) }"
        :key="chip.value + idx"
        :color="chip.color"
        >{{ chip.value }}</span
      >
    </div>
    <v-text-field
      ref="input"
      :value="InnerText"
      @input="$emit('input', $event)"
      @focus.stop="InputFocus(true)"
      @blur="InputFocus(false)"
      autocomplete="off"
    >
    </v-text-field>
  </div>
</template>

<style scoped>
.component {
  position: relative;
}
.chips {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: center;
  width: 100%;
  height: 47px;
  position: absolute;
  margin-left: 3px;
  overflow-x: hidden;
}
.value {
  margin-left: 0;
  margin-right: 0;
  padding-left: 3px;
  padding-right: 3px;
  border-radius: 0;
  background-color: #ff5722;
}

.operator {
  margin-left: 0;
  margin-right: 0;
  padding-left: 5px;
  padding-right: 5px;
  border-radius: 0;
  background-color: #ba68c8;
}
</style>

<script lang="ts">
import { Component, Emit, Model, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
export enum Shape { ROUND, RECT }
export interface Chip {
  value: string;
  form: Shape;
  color: string;
}

@Component
export default class InputWithChips extends Vue {
  @Model('input') private readonly value!: string;

  @Prop({ required: true })
  private readonly chips!: Chip[];

  @Prop({ required: true })
  private readonly focused!: boolean;

  @Ref('input')
  private inputRef!: HTMLInputElement;

  @Emit('inputFocus')
  private InputFocus(focus: boolean) { this.focus = focus; }

  private focus: boolean = false;

  private get InnerText() { return this.focus ? this.value : ''; }

  public async mounted() {
    if (this.focused) {
      await this.$nextTick();
      this.inputRef.focus();
    }
  }

  private IsRectForm(chip: Chip) {
    return chip.form === Shape.RECT;
  }
}
</script>