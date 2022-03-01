<template>
<div>
    <AddRecordDlg @add="AddRecord" v-model="addRecordDlgShown" />
    <v-app-bar app color="primary">
      <v-btn icon to="/archive">
        <v-icon>arrow_back</v-icon>
      </v-btn>
      <v-toolbar-title>Playlist</v-toolbar-title>
      <v-spacer></v-spacer>
    </v-app-bar>
    <div :class="TimelineOrientation" class="timeline">
      <template v-for="(c, i) in TimelineComponents">
        <v-btn v-if="IsInsertBtn(c)" :key="`insertBtn${c.position}`" @click="InsertBtnClick(c.position)" :class="InsertBtnOrientation"><v-icon>mdi-plus</v-icon></v-btn>
        <FragmentPreview
        v-else-if="IsPreviewFragment(c)"
        :key="`preview_${c.record.filename}_${i}`"
        @remove="RemoveFragmentBtnClick"
        @loop="LoopChanged"
        :segment="c.record"
        :position="RecordIndex(i)"
        class="fragment-preview" />
      </template>
    </div>
    <router-view :segments="records" @init="PrefillRecords"></router-view>
</div>
</template>

<style scoped>
.timeline {
  display: flex;
  overflow-x: scroll;
}
.timeline-portrait {
  flex-direction: column;
}
.timeline-landscape {
  flex-direction: row;
}
.timeline > .insert-btn-portrait {
  width: auto;
  min-width: 333px;
}
.timeline > .insert-btn-landscape {
  height: auto;
  min-height: 333px;
}
.fragment-preview {
  width: 500px;
  flex-shrink: 0;
}
</style>

<script lang="ts">
import { Component, Mixins, Prop, Vue } from 'vue-property-decorator';

import { SerializedArchiveRecord as ArchiveRecord, SerializedFileRecord as FileRecord } from '@Shared/Types';
import { IsPortrait } from '../Common/IsPortrait';
import { ThumbnailFromFilename } from '../Common/ThumbnailFromFilename';
import AddRecordDlg from '../Components/Playlist/AddRecordDlg.vue';
import FragmentPreview, { Segment } from '../Components/Playlist/FragmentPreview.vue';
import { LoopEvent, LoopValueType } from '../Components/Playlist/LoopMenu.vue';
import OrientationChange, { Orientation } from '../Mixins/OrientationChange';

enum TimelineComponentType { InsertBtn, Record }

interface TimelineComponent {
  type: TimelineComponentType;
}

interface InsertBtnComponent extends TimelineComponent {
  position: number;
}

interface RecordComponent {
  record: Segment;
}

@Component({
  components: {
    AddRecordDlg,
    FragmentPreview
  }
})
export default class Playlist extends Mixins(OrientationChange) {
  private records: Segment[] = [];

  private addRecordDlgShown = false;

  private insertPosition = 0;

  private orientation: Orientation = Orientation.Landscape;

  public OrientationChange(e: Orientation): void {
    this.orientation = e;
  }

  private PrefillRecords(records: ArchiveRecord[]) {
    this.records = [...records.map(x => ({ ...x, thumbnail: ThumbnailFromFilename(x.filename) }))]
      .map(x => ({ record: x, begin: 0, end: x.duration, loop: 1 }));
  }

  private get TimelineComponents() {
    return [{ type: TimelineComponentType.InsertBtn, position: 0 } as InsertBtnComponent,
      ...this.records.flatMap((x, i) => [{ type: TimelineComponentType.Record, record: x } as RecordComponent,
        { type: TimelineComponentType.InsertBtn, position: i + 1 } as InsertBtnComponent])];
  }

  private IsInsertBtn(component: TimelineComponent) {
    return component.type === TimelineComponentType.InsertBtn;
  }

  private IsPreviewFragment(component: TimelineComponent) {
    return component.type === TimelineComponentType.Record;
  }

  private InsertBtnClick(position: number) {
    this.insertPosition = position;
    this.OpenAddRecordDlg();
  }

  private RemoveFragmentBtnClick(position: number) {
    this.records.splice(position, 1);
  }

  private LoopChanged(position: number, e: LoopEvent) {
    if (e.type === LoopValueType.Add) {
      this.records[position].loop += e.value;
    } else if (e.type === LoopValueType.Set) {
      this.records[position].loop = e.value;
    }
  }

  private OpenAddRecordDlg() {
    this.addRecordDlgShown = true;
  }

  private CloseAddRecordDlg() {
    this.addRecordDlgShown = false;
  }

  private AddRecord(file: FileRecord) {
    this.records.splice(this.insertPosition, 0, { record: file, begin: 0, end: file.duration, loop: 1 });

    this.CloseAddRecordDlg();
  }

  private RecordIndex(globalPosition: number) {
    return Math.trunc(globalPosition / 2);
  }

  private ConstructOrientationClassName(prefix: string) {
    return `${prefix}-${this.orientation === Orientation.Portrait ? 'portrait' : 'landscape'}`;
  }

  private get TimelineOrientation() {
    return this.ConstructOrientationClassName('timeline');
  }

  private get InsertBtnOrientation() {
    return this.ConstructOrientationClassName('insert-btn');
  }
}
</script>
