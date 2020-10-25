<template>
  <v-row>
    <v-col v-for="item in items" :key="item.id" :cols="cols">
      <RecordCard v-if="item.type==='record'" :file="item" />
      <ClipProgressCard v-else-if="item.type==='clip'" :clip="item" />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import 'reflect-metadata';

import { Component, Prop, Vue } from 'vue-property-decorator';

import ClipProgressCard from '@/Components/Archive/ClipProgressCard.vue';
import RecordCard from '@/Components/Archive/RecordCard.vue';

@Component({
  components: {
    ClipProgressCard,
    RecordCard
  }})
export default class RowWrapper<T> extends Vue {
  @Prop({ required: true }) private readonly cols!: number;
  @Prop({ required: true }) private readonly items!: T[];
}
</script>