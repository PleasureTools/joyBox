<template>
  <div>
    <v-card-title class="headline" primary-title>Syntax</v-card-title>
    <v-card-text>
      <p>
        Filter phrases can be combined using logical operations:
        <span class="keyword">&amp;</span>,
        <span class="keyword">|</span>. Parentheses available. Example
        <span
          class="keyword"
        >(bongacams | chaturbate) &amp; model_name</span>
      </p>
      <h3 class="subtitle-2">Keywords</h3>
      <p>
        <span class="keyword font-weight-bold">seen</span> - filtering by time of the last stream. For example
        <span class="keyword">seen:1</span> shows only sources that were online exactly 1 day ago. Inequality operations
        <span class="keyword">&lt;</span> and <span class="keyword">&gt;</span> are also available. Possible units of measurement are hours, days and months, use shorthands
        <span class="keyword">h</span>, <span class="keyword">d</span>, <span class="keyword">m</span> respectively, days are used by default.
        <span class="keyword">seen:&lt;1m</span> - will show the sources that streamed less than a month ago.
      </p>
      <p>
        <span class="keyword font-weight-bold">plugin</span> - filtering by plugin, which is currently used to process the source. Possible values:
        <span
          class="keyword"
        >bongacams</span>,
        <span class="keyword">bongacams_direct</span>,
        <span class="keyword">camsoda</span>,
        <span class="keyword">chaturbate</span>,
        <span class="keyword">dummy</span>
      </p>
    </v-card-text>
  </div>
</template>

<style lang="css" scoped>
.keyword {
  color: #252525;
  font-weight: 500;
  font-family: monospace, monospace;
  background-color: #dbebf3;
  padding: 0 2px;
  border-radius: 4px;
}
</style>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class FilterInfo extends Vue { }
</script>