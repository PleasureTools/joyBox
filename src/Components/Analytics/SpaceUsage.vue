<template>
  <HorizontalBar ref="chart" :chartData="data" :options="options" />
</template>

<style scoped>
</style>

<script lang="ts">
import prettyBytes from 'pretty-bytes';
import { Component, Emit, Mixins, Model, Prop, Ref, Vue } from 'vue-property-decorator';

import { ChartData } from '@/Common/interfaces/Chartjs';
import HorizontalBar from '@/Components/Charts/HorizontalBar';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { Context } from 'chartjs-plugin-datalabels';

interface SpaceUsageBySource {
  source: string;
  space: number;
}

@Component({
  components: {
    HorizontalBar
  }
})
export default class SpaceUsage extends Mixins(RefsForwarding) {
  @Ref()
  private readonly chart!: Vue;
  private data!: ChartData<number, string>;
  private options = {
    maintainAspectRatio: false,
    legend: { display: false },
    scales: {
      yAxes: [{ ticks: { display: false } }],
      xAxes: [{ ticks: { callback: this.FormatXAxes.bind(this) } }]
    },
    tooltips: { callbacks: { label: (item: any, data: any) => this.TooltipLabel(item, data) } },
    plugins: {
      datalabels: {
        anchor: 'start',
        align: 'right',
        formatter: this.FormatLabel.bind(this)
      }
    }
  };
  public beforeMount() {
    const stats = [...this.App.RecordsByNewest
      .reduce((s: Map<string, number>, r) => {
        const usage = s.get(r.source);
        s.set(r.source, usage === undefined ? r.size : usage + r.size);
        return s;
      }, new Map())]
      .sort((a, b) => b[1] - a[1]);

    this.data = {
      labels: stats.map(x => x[0]),
      datasets: [{
        label: 'Space usage',
        backgroundColor: '#f87979',
        data: stats.map(x => x[1]),
        barThickness: 'flex'
      }]
    };
  }
  public mounted() {
    (this.chart.$el as HTMLElement).style.height = `${this.data.labels!.length * 50}px`;
  }
  private TooltipLabel(item: any, data: any) {
    return prettyBytes(data.datasets[item.datasetIndex].data[item.index]);
  }
  private FormatLabel(value: number, context: Context) {
    const source = this.data.labels![context.dataIndex];
    return `${source}   ${prettyBytes(value)}`;
  }
  private FormatXAxes(value: number, index: number, values: number[]) {
    return prettyBytes(value);
  }
}
</script>