<template>
  <div>
    <v-card-title class="headline" primary-title>Syntax</v-card-title>
    <v-card-text>
      <p>
        Filter phrases can be combined using logical operations:
        <span class="keyword">&amp;</span>,
        <span class="keyword">|</span>. Parentheses available. Example
        <span class="keyword">(bongacams | chaturbate) &amp; model_name</span>
      </p>
      <h3 class="subtitle-2">Keywords</h3>
      <p>
          <span class="keyword font-weight-bold">size</span> - Filter by size.
          Units: <span class="keyword">kB</span>,<span class="keyword">MB</span>,<span class="keyword">GB</span>,<span class="keyword">TB</span><br>
          <span class="keyword">size:100</span> - filter records having a size of 100 MB<br>
          <span class="keyword">size:>5GB</span> - filter records having size greater than 5 GB<br>
          <span class="keyword">size:&lt;800MB</span> - filter records having size less than 800 MB
      </p>
      <p>
           <span class="keyword font-weight-bold">len</span> - Filter by length (in minutes).<br>
           <span class="keyword">len:>60</span> - filter records that duration longer than hour<br>
      </p>
       <p>
           <span class="keyword font-weight-bold">source</span> - Filter by source.<br>
           <span class="keyword">source:provider/channel</span> - filter records with given source<br>
      </p>
    </v-card-text>
  </div>
</template>

<style scoped>
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
import { Component, Emit, Mixins, Model, Prop, Vue } from 'vue-property-decorator';

@Component
export default class FilterInfo extends Vue {
}
</script>