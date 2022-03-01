<template>
  <v-row>
    <v-col v-for="item in items" :key="item.id" :cols="cols">
      <slot v-if="item.type==='record'" :file="item" />
      <PlaylistCard v-else-if="item.type==='playlist'" :playlist="item" />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import 'reflect-metadata';

import { Component, Prop, Vue } from 'vue-property-decorator';

import PlaylistCard from '@/Components/Archive/PlaylistCard.vue';
import RecordCard from '@/Components/Archive/RecordCard.vue';

@Component({
  components: {
    PlaylistCard,
    RecordCard
  }
})
export default class RowWrapper<T> extends Vue {
  @Prop({ required: true }) private readonly cols!: number;
  @Prop({ required: true }) private readonly items!: T[];
}
</script>
