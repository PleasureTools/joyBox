<template>
  <div>
    <v-app-bar app color="primary">
      <v-btn icon to="/">
        <v-icon>home</v-icon>
      </v-btn>
    </v-app-bar>
    <p class="text-center font-weight-bold display-3 blue-grey--text text--lighten-4">Page not found</p>
  </div>
</template>

<script lang="ts">
import { Vue } from 'vue-property-decorator';

import { AppComponent } from '@/Common/Decorators/AppComponent';
import RefsForwarding from '@/Mixins/RefsForwarding';

@AppComponent({})
export default class PageNotFound extends Vue { }
</script>