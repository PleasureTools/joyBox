<template>
  <LineChart ref="chart" :chartData="data" :options="options" />
</template>

<style scoped>
</style>

<script lang="ts">
import { Component, Emit, Mixins, Model, Prop, Ref, Vue } from 'vue-property-decorator';

import { ChartData } from '@/Common/interfaces/Chartjs';
import { ParticalSum } from '@/Common/ParticalSum';
import LineChart from '@/Components/Charts/LineChart';
import RefsForwarding from '@/Mixins/RefsForwarding';

@Component({
  components: {
    LineChart
  }
})
export default class ArchivePopulation extends Mixins(RefsForwarding) {
  @Ref()
  private readonly chart!: Vue;
  private data!: ChartData<number, Date>;
  private options = {
    maintainAspectRatio: false,
    legend: { display: false },
    scales: {
      xAxes: [{
        type: 'time',
        time: {
          unit: 'week'
        }
      }]
    }
  };
  public beforeMount() {
    const r = [...this.App.RecordsByNewest].reverse();

    this.data = {
      labels: r.map(x => new Date(x.timestamp * 1000)),
      datasets: [{
        label: 'Archive population',
        borderColor: '#f87979',
        fill: false,
        data: Array.from(ParticalSum(r.map(x => x.size / 1000 ** 3))),
        barThickness: 'flex',
        datalabels: {
          labels: {
            title: null
          }
        }
      }]
    };
  }
  public mounted() {
    const chartEl = (this.chart.$el as HTMLElement);
    chartEl.style.height = `${window.innerHeight * 0.8}px`;
  }
}
</script>