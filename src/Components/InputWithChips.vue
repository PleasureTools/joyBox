<!-- 
    Shows text when focused or chips when not focused.
 -->
<template>
  <div>
    <v-dialog v-model="infoShown" width="500">
      <v-card>
        <slot name="info"></slot>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="CloseInfo">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-chip-group v-if="!focusedInner" class="chips">
      <v-chip
        :label="IsRectForm(chip)"
        :class="{ value: IsRectForm(chip) }"
        v-for="(chip, idx) in chips"
        :key="chip.value + idx"
        :color="chip.color"
      >{{ chip.value }}</v-chip>
    </v-chip-group>
    <v-text-field
      ref="input"
      :value="InnerText"
      append-icon="mdi-information"
      @click:append="ShowInfo"
      @input="$emit('input', $event)"
      @focus="Focus(true)"
      @blur="Focus(false)"
    ></v-text-field>
  </div>
</template>

<style scoped>
.chips {
  position: absolute;
  margin-left: 3px;
}
.value {
  padding-left: 3px;
  padding-right: 3px;
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
  private focusedInner: boolean = false;
  private infoShown = false;

  @Model('input') private readonly value!: string;
  @Prop({ required: true }) private readonly chips!: Chip[];
  @Prop({ required: true }) private readonly focused!: boolean;
  @Ref('input') private inputRef!: HTMLInputElement;

  private get InnerText() { return this.focusedInner ? this.value : ''; }

  public async mounted() {
    if (this.focused) {
      await this.$nextTick();
      this.inputRef.focus();
    }
  }

  private Focus(val: boolean) { this.focusedInner = val; }

  private IsRectForm(chip: Chip) {
    return chip.form === Shape.RECT;
  }

  private ShowInfo() { this.infoShown = true; }

  private CloseInfo() { this.infoShown = false; }
}
</script>