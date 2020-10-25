<template>
  <InputWithChips
    :value="filter"
    v-stream:input="filterInput"
    :focused="focused"
    :chips="tokens"
  >
    <slot name="info" slot="info"></slot>
  </InputWithChips>
</template>

<script lang="ts">
import { interval, Subject, Subscription } from 'rxjs';
import { debounce } from 'rxjs/operators';
import { Component, Emit, Mixins, Model, Prop, Vue, Watch } from 'vue-property-decorator';

import { BoolFilter, ValidationError, ValueNode } from '@/Common';
import InputWithChips, { Chip, Shape } from '@/Components/InputWithChips.vue';
import { NotificationType } from '@/Plugins/Notifications/Types';
import { InputEventSubject } from '@/types';

@Component({
  components: {
    InputWithChips
  }
})
export default class SearchFilter<T> extends Vue {
  @Model()
  public readonly value!: string;

  @Emit('input')
  public Input(val: string) { }

  @Emit('updateInstance')
  public UpdateInstance(instance: BoolFilter<T, ValueNode<T>> | null) { }

  @Emit('validationError')
  public ValidationError(msg: string) { }

  @Prop({ required: true })
  public nodeType!: new (filter: string) => ValueNode<T>;

  @Watch('value')
  private ModelChange(val: string, old: string) {
    this.filter = val;
    this.ApplyFilter();
  }

  private filter = '';
  private tokens: Chip[] = [];
  private focused = true;
  private filterInput = new Subject<InputEventSubject<string>>();
  private filterInputUnsub!: Subscription;
  private booleanFilter: BoolFilter<T, ValueNode<T>> | null = null;

  public created() {
    if (this.value.length) {
      this.focused = false;
      this.filter = this.value;
      this.ApplyFilter();
    }
  }

  public mounted() {
    this.filterInputUnsub = this.filterInput
      .pipe(debounce(() => interval(200)))
      .subscribe(x => this.OnInput(x.event.msg));
  }

  public beforeDestroy() {
    this.UpdateInstance(null);
  }

  public destroyed() {
    this.filterInputUnsub.unsubscribe();
  }

  private OnInput(val: string) {
    this.ModelChange(val, '');
    this.Input(val);
  }

  private ApplyFilter() {
    try {
      if (this.filter) {
        this.booleanFilter = new BoolFilter(this.nodeType, this.filter);
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
}
</script>