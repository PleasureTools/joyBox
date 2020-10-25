<template>
  <v-list class="tag-manager">
    <v-list-item-group>
      <v-list-item>
        <v-list-item-content>
          <v-text-field
            v-model="tagInput"
            @click:append="Attach"
            :append-icon="IsUnique ? 'mdi-content-save' : ''"
            single-line
          />
        </v-list-item-content>
      </v-list-item>
      <v-list-item class="d-flex flex-wrap">
        <v-chip
          v-for="t in record.tags"
          :key="t"
          class="ma-1"
          close
          @click:close="Detach(t)"
        >{{ t }}</v-chip>
      </v-list-item>
    </v-list-item-group>
    <v-btn @click="close" icon class="close-btn">
      <v-icon>mdi-close</v-icon>
    </v-btn>
  </v-list>
</template>

<style scoped>
.tag-manager {
  position: absolute;
  overflow-y: auto;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
.close-btn {
  position: absolute;
  top: 0;
  right: 0;
}
</style>

<script lang="ts">
import { Component, Emit, Mixins, Model, Prop, Vue } from 'vue-property-decorator';

import { SerializedFileRecord as FileRecord } from '@Shared/Types';

@Component
export default class TagManager extends Vue {
  private tagInput = '';
  @Prop({ required: true }) private readonly record!: FileRecord;
  @Emit() private close() { }
  private get IsUnique() {
    return this.tagInput !== '' && !this.record.tags.includes(this.tagInput);
  }
  private async Attach() {
    await this.$rpc.AttachTagToArchiveRecord(this.record.filename, this.tagInput);
    this.tagInput = '';
  }
  private Detach(tag: string) {
    this.$rpc.DetachTagFromArchiveRecord(this.record.filename, tag);
  }
}
</script>