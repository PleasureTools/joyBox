<template>
  <v-row>
    <v-col v-for="item in items" :key="item.id">
      <ArchiveItem v-if="item.type==='record'" :file="item" />
      <ClipProgress v-else-if="item.type==='clip'" :clip="item"/>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import 'reflect-metadata';

import { Component, Prop, Vue } from 'vue-property-decorator';

import { ArchiveItem } from '@/Components/Archive';
import ClipProgress from '@/Components/Archive/ClipProgress.vue';

@Component({
  components: {
    ArchiveItem,
    ClipProgress
  }})
export default class ArchiveRowWrapper extends Vue {
  @Prop({ required: true }) private readonly items!: any[];
}
</script>