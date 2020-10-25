<template>
  <v-snackbar @input="Change" :timeout="timeout" value="true" vertical>
    <div>{{ message }}</div>
    <div :style="{ backgroundColor: Color}" class="type"></div>
  </v-snackbar>
</template>

<style scoped>
.type {
  position: relative;
  bottom: -8px;
  height: 3px;
  margin: 0 -16px;
}
</style>

<script lang="ts">
import { Component, Emit, Mixins, Model, Prop, Vue } from 'vue-property-decorator';

import { NotificationType } from './Types';

@Component
export default class Notifications extends Vue {
  @Prop({ default: 3000 })
  public readonly timeout!: number;
  @Prop({ required: true })
  public readonly message!: string;
  @Prop({ required: true })
  public readonly type!: NotificationType;
  private model = true;
  private get Color() {
    const theme = (this.$vuetify.theme as any).currentTheme;
    return [theme.info, theme.warning, theme.error][this.type];
  }
  private Change(val: boolean) {
      this.$destroy();
  }
}
</script>