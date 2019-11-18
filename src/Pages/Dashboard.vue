<template>
  <v-container grid-list-md fluid>
    <v-row>
      <v-col cols="12" sm="6">
        <Tile title="Observables" href="/observables">
          <ObservablesTile />
        </Tile>
      </v-col>
      <v-col cols="12" sm="6">
        <Tile title="Active Recordings" href="/recorder">
          <RecorderTile />
        </Tile>
      </v-col>
      <v-col cols="12" sm="6">
        <Tile title="Archive" href="/archive">
          <ArchiveTile />
        </Tile>
      </v-col>
      <v-col cols="12" sm="6">
        <Tile title="System" href="/system">
          <SystemTile />
        </Tile>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.dashboard {
  display: grid;
}
.number {
  font-size: 4.5em;
}
@media (orientation: landscape) {
  .dashboard {
    grid-template-columns: 50% 50%;
  }
}
</style>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import Observables from '@/Components/Observables.vue';
import System from '@/Components/SystemTile.vue';
import Tile from '@/Components/Tile.vue';
import { ArchiveTile, ObservablesTile, RecorderTile, SystemTile } from '@/Components/Tiles';

@Component({
  components: {
    Tile,
    ObservablesTile,
    RecorderTile,
    SystemTile,
    ArchiveTile
  }
})
export default class Dashboard extends Vue { }
</script>