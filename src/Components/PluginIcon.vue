<template>
  <img v-if="Bongacams" src="~@/assets/plugins/bongacams.png" />
  <img v-else-if="BongacamsDirect" src="~@/assets/plugins/bongacams_direct.png" />
  <img v-else-if="Chaturbate" src="~@/assets/plugins/chaturbate.png" />
  <img v-else-if="Dummy" src="~@/assets/plugins/dummy.png" />
  <v-icon v-else>block</v-icon>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class PluginIcon extends Vue {
  @Prop() public name!: string;

  private get Bongacams(): boolean {
    return this.name === 'bongacams';
  }

  private get BongacamsDirect() {
    return this.name === 'bongacams_direct';
  }

  private get Chaturbate(): boolean {
    return this.name === 'chaturbate';
  }

  private get Dummy() {
    return this.name === 'dummy';
  }

}
</script>