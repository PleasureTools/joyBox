import { HorizontalBar as ChartJsHorizontalBar, mixins } from 'vue-chartjs';
import { Component, Mixins, Prop } from 'vue-property-decorator';

@Component
export default class HorizontalBar extends Mixins(ChartJsHorizontalBar, mixins.reactiveProp) {
    @Prop({ required: false })
    public readonly options: any;
    public mounted() {
        this.renderChart(this.chartData, this.options);
    }
}
