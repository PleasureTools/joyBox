<template>
  <v-card class="container" :class="AlignmentClass">
    <v-list v-if="Hidden">
        <v-list-item v-for="p in clipsProgress" :key="p.label" dense class="clip-progress">
            <v-progress-linear :value="p.progress" />
            <span class="duration">{{ Duration(p.duration) }}</span>
            <v-icon>mdi-clock-outline</v-icon>
            <CountdownTimer :value="p.eta" />
        </v-list-item>
    </v-list>
    <v-btn @click="SwitchVisibility" icon x-large class="visibility-mode-btn">
        <v-icon>{{ VisibilityModeIcon }}</v-icon>
    </v-btn>
  </v-card>
</template>

<style scoped>
.container {
    left: 15%;
    width: 70%;
    box-shadow: 0px 0px 18px #585555;
}

.hidden {
    bottom: -20px;
}

.visibility-mode-btn {
    position: absolute;
    background-color: white;
    right: 45%;
}

.top-alignment .visibility-mode-btn {
    bottom: -27px;
}

.bottom-alignment .visibility-mode-btn {
    top: -27px;
    box-shadow: 0px -12px 13px -12px #585555;
}

.top-alignment {
    position: absolute;
    top: 0;
}

.bottom-alignment {
    position: fixed;
    bottom: 0;
}

.clip-progress {
    height: 50px;
}

.duration {
    margin: 0 10px;
}
</style>

<script lang="ts">
import 'reflect-metadata';

import fd from 'format-duration';
import { Component, Emit, Model, Prop, Vue } from 'vue-property-decorator';

import CountdownTimer from '@/Components/CountdownTimer.vue';
import { ClipProgressState } from '@Shared/Types';

@Component({
  components: {
    CountdownTimer
  }
})
export default class ClipProgressPopup extends Vue {
  @Prop({ required: true })
  private readonly clipsProgress!: ClipProgressState[];

  private maximized = false;

  private readonly arrowDownIcon = 'mdi-arrow-down-drop-circle';
  private readonly arrowUpIcon = 'mdi-arrow-up-drop-circle';

  private Duration(duration: number) {
    return fd(duration * 1000);
  }

  private get AlignmentTop() {
    return this.$route.path.startsWith('/player/') || this.$route.path.startsWith('/clip/');
  }

  private get AlignmentClass() {
    return this.AlignmentTop ? 'top-alignment' : 'bottom-alignment';
  }

  private get VisibilityModeIcon() {
    return this.maximized === this.AlignmentTop ? this.arrowDownIcon : this.arrowUpIcon;
  }

  private SwitchVisibility() {
    this.maximized = !this.maximized;
  }

  private get Hidden() {
    return !this.maximized;
  }
}
</script>
