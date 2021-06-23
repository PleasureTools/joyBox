<template>
  <div class="component">
    <InfoDialog v-model="showInfoDialog">
      <slot name="info" slot="info"></slot>
    </InfoDialog>
    <SaveFilterDialog v-model="showSaveFilterDialog" @save="SaveFilter" />
    <InputWithChips
      :value="value"
      v-stream:input="filterInput"
      :focused="focused"
      :chips="tokens"
      @inputFocus="FilterHasFocus"
    >
    </InputWithChips>
    <div class="appendBlock">
      <v-btn v-if="value.length" @click="ShowSaveFilterDialog" icon>
        <v-icon>mdi-content-save</v-icon>
      </v-btn>
      <v-btn @click="ShowInfoDialog" icon>
        <v-icon>mdi-information</v-icon>
      </v-btn>
    </div>
    <v-menu v-model="menu" attach="#menuAnchor">
      <v-list>
        <v-list-item v-for="item in preparedQueries" :key="item.id" link>
          <v-list-item-title @click="FilterItemClick(item)">{{
            item.name
          }}</v-list-item-title>
          <v-list-item-icon>
            <v-btn @click="RemoveFilter(item)" icon
              ><v-icon>mdi-delete</v-icon></v-btn
            >
          </v-list-item-icon>
        </v-list-item>
      </v-list>
    </v-menu>
    <div id="menuAnchor"></div>
  </div>
</template>

<style scoped>
.component {
  position: relative;
}
#menuAnchor {
  position: relative;
  top: -21px;
}
.appendBlock {
  position: absolute;
  right: 1px;
  top: 6px;
}
</style>

<script lang="ts">
import { interval, Subject, Subscription } from 'rxjs';
import { debounce } from 'rxjs/operators';
import { Component, Emit, Mixins, Model, Prop, Ref, Vue, Watch } from 'vue-property-decorator';

import { BoolFilter, ValidationError, ValueNode } from '@/Common';
import InfoDialog from '@/Components/InfoDialog.vue';
import InputWithChips, { Chip, Shape } from '@/Components/InputWithChips.vue';
import SaveFilterDialog from '@/Components/SearchFilter/SaveFilterDialog.vue';
import { NotificationType } from '@/Plugins/Notifications/Types';
import { InputEventSubject } from '@/types';
import { Filter } from '@Shared/Types';

@Component({
  components: {
    InfoDialog,
    InputWithChips,
    SaveFilterDialog
  }
})
export default class SearchFilter<T> extends Vue {
  @Model()
  public readonly value!: string;

  @Emit('input')
  public EmitInput(val: string) { }

  @Emit('updateInstance')
  public UpdateInstance(instance: BoolFilter<T, ValueNode<T>> | null) { }

  @Emit('validationError')
  public ValidationError(msg: string) { }

  @Emit('save')
  private SaveFilter(name: string) { }

  @Emit('remove')
  private RemoveFilter(index: number) { }

  @Prop({ required: true })
  public nodeType!: new (filter: string) => ValueNode<T>;

  @Prop({ required: false })
  public preparedQueries!: Filter[];

  @Watch('value')
  private ModelChange(value: string, old: string) {
    this.ApplyFilter(value);
  }

  private showInfoDialog = false;
  private showSaveFilterDialog = false;

  private menu = false;
  private tokens: Chip[] = [];
  private focused = true;
  private filterInput = new Subject<InputEventSubject<string>>();
  private filterInputUnsub!: Subscription;
  private booleanFilter: BoolFilter<T, ValueNode<T>> | null = null;
  private showMenuTimer: number = -1;

  public created() {
    if (this.value.length) {
      this.focused = false;
      this.ApplyFilter(this.value);
    }
  }

  public mounted() {
    this.filterInputUnsub = this.filterInput
      .pipe(debounce(() => interval(200)))
      .subscribe(x => this.EmitInput(x.event.msg));
  }

  public beforeDestroy() {
    this.UpdateInstance(null);
  }

  public destroyed() {
    this.filterInputUnsub.unsubscribe();
  }

  private async FilterHasFocus(focus: boolean) {
    if (focus) {
      this.showMenuTimer = setTimeout(() => this.menu = true, 200);
    } else {
      clearTimeout(this.showMenuTimer);
      this.showMenuTimer = -1;
    }
  }

  private FilterItemClick(filter: Filter) {
    this.EmitInput(filter.query);
    this.ApplyFilter(filter.query);
  }

  private ApplyFilter(value: string) {
    try {
      if (value) {
        this.booleanFilter = new BoolFilter(this.nodeType, value);
        this.tokens = this.booleanFilter.Tokens
          .map(x => ({
            value: x.value,
            form: x.type ? Shape.ROUND : Shape.RECT,
            color: x.type ? '#ba68c8' : '#ff5722'
          }));
      } else {
        this.booleanFilter = null;
        this.tokens = [];
      }

      this.UpdateInstance(this.booleanFilter);

    } catch (e) {
      if (e instanceof ValidationError) {
        this.tokens = [{ value: 'Invalid expression', form: Shape.RECT, color: '#e53935' }];

        this.ValidationError(e.Format());
      }
    }
  }

  private ShowInfoDialog() {
    this.showInfoDialog = true;
  }

  private ShowSaveFilterDialog() {
    this.showSaveFilterDialog = true;
  }
}
</script>