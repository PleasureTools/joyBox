<template>
<v-dialog :value="show" @input="Change">
  <RecordsView class="view">
    <template v-slot="{items, cols}">
    <RowWrapper :items="items" :cols="cols" class="row">
      <template v-slot="{file}">
        <RecordCard v-on="$listeners" :file="file" />
      </template>
    </RowWrapper>
    </template>
  </RecordsView>
</v-dialog>
</template>

<style scoped>
.view {
  height: 90vh;
}
.row {
  margin: 0 2px;
}
</style>

<script lang="ts">
import { Component, Emit, Model, Prop, Vue } from 'vue-property-decorator';

import RowWrapper from '@/Components/Archive/RowWrapper.vue';
import { SerializedFileRecord as FileRecord } from '@Shared/Types';
import RecordsView from '../Archive/RecordsView.vue';
import RecordCard from './RecordCard.vue';

@Component({
  components: {
    RecordCard,
    RecordsView,
    RowWrapper
  }
})
export default class AddRecordDlg extends Vue {
  @Model('show')
  private readonly show!: boolean ;

  @Emit('show')
  private Change(e: boolean) { }
}
</script>
