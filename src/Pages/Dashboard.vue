<template>
  <v-container grid-list-md fluid>
    <v-row>
      <v-col cols="12" sm="6">
        <Tile title="Observables" href="/observables">
          <Observables />
        </Tile>
      </v-col>
      <v-col cols="12" sm="6">
        <Tile title="Active Recordings" href="/recorder">
          <Recorder />
        </Tile>
      </v-col>
      <v-col cols="12" sm="6">
        <Tile title="Archive" href="/archive">
          <Archive />
        </Tile>
      </v-col>
      <v-col cols="12" sm="6">
        <Tile title="System" href="/system">
          <System />
        </Tile>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import Tile from '@/Components/Tile.vue';
import { Archive, Observables, Recorder, System } from '@/Components/Tiles';

@Component({
  components: {
    Tile,
    Observables,
    Recorder,
    System,
    Archive
  }
})
export default class Dashboard extends Vue { }
</script>