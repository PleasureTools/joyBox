<<template>
<v-dialog :value="show" @input="Show" width="500">
      <v-card>
        <v-card-title class="title font-weight-medium justify-center"
          >Save filter</v-card-title
        >
        <v-card-text>
          <v-form onsubmit="return false;">
            <v-text-field v-model="filterName" />
            <v-btn @click="Save(filterName)" type="submit">Save</v-btn>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
</template>

<style scoped>
</style>

<script lang="ts">
import { Component, Emit, Model, Vue } from 'vue-property-decorator';

@Component
export default class extends Vue {
  @Model()
  private show = false;

  @Emit('show')
  private Show(show: boolean) { }

  @Emit('save')
  private Save(name: string) {
    this.Show(false);
    this.filterName = '';
  }

  private filterName = '';
}
</script>