<template>
    <VideoPlayer class="fill-height" :src="Source" :behaiverOverride="{ Seek: SeekOverride, CurrentTime: CurrentTimeOverride, durationUI: Duration }">
    </VideoPlayer>
</template>

<style scoped>
</style>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator';

import VideoPlayer, { BehaivorAction } from '@/Components/VideoPlayer.vue';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { Playlist } from '@Shared/Types';

type second = number;

@Component({
  components: {
    VideoPlayer
  }
})
export default class PlaylistPlayer extends Mixins(RefsForwarding) {
  private playlist!: Playlist;
  private segmentIdx = 0;
  private loop = 1;

  public created(): void {
    const found = this.App.playlists.find(x => x.id === this.Id);

    if (!found) {
      this.$router.push({ path: '/' });
      return;
    }

    this.playlist = found;
  }

  private get Id() {
    return Number.parseInt(this.$route.params.pathMatch, 10);
  }

  private get Source() {
    return `${this.Env.Origin}/archive/${this.Segment.filename}`;
  }

  private get Segment() {
    return this.playlist.segments[this.segmentIdx];
  }

  private SeekOverride(seek: number) {
    const pos = this.SearchPosition(seek);
    this.loop = pos.loop;
    this.segmentIdx = pos.segment;

    return pos.currentTime;
  }

  private CurrentTimeOverride(pos: number) {
    const seg = this.Segment;

    if (pos < seg.begin) {
      return { action: BehaivorAction.Nope, currentTime: seg.begin, currentTimeUI: this.CurrentTimeUI(seg.begin) };
    }

    if (pos > seg.end) {
      if (this.loop < seg.loop) {
        // Play in loop
        ++this.loop;
        return { action: BehaivorAction.Play, currentTime: seg.begin, currentTimeUI: this.CurrentTimeUI(seg.begin) };
      } else {
        // Play next segment
        if (this.segmentIdx + 1 < this.playlist.segments.length) {
          this.loop = 1;
          ++this.segmentIdx;
          return { action: BehaivorAction.Play, currentTime: seg.begin, currentTimeUI: this.CurrentTimeUI(seg.begin) };
        } else {
          // Reached the end
          this.segmentIdx = 0;
          this.loop = 1;

          return { action: BehaivorAction.Stop, currentTime: 0, currentTimeUI: this.CurrentTimeUI(seg.end) };
        }
      }
    }

    return { action: BehaivorAction.Nope, currentTime: -1, currentTimeUI: this.CurrentTimeUI(pos) };
  }

  private SearchPosition(normalizedPosition: number) {
    const inPlaylistPosition = normalizedPosition * this.Duration;

    for (let i = 0, duration = 0; i < this.playlist.segments.length; ++i) {
      const seg = this.playlist.segments[i];
      const segDuration = seg.end - seg.begin;

      if (inPlaylistPosition >= duration && inPlaylistPosition <= duration + segDuration * seg.loop) {
        return {
          currentTime: (inPlaylistPosition - duration) % (segDuration) + seg.begin,
          segment: i,
          loop: Math.trunc((inPlaylistPosition - duration) / segDuration) + 1
        };
      }

      duration += segDuration * seg.loop;
    }

    return { currentTime: 0, segment: 0, loop: 0 };
  }

  private CurrentTimeUI(position: second) {
    let ret = 0;
    for (let i = 0; i < this.segmentIdx; ++i) {
      const seg = this.playlist.segments[i];
      ret += (seg.end - seg.begin) * seg.loop;
    }

    ret += (this.Segment.end - this.Segment.begin) * (this.loop - 1) + position - this.Segment.begin;

    return ret;
  }

  private get Duration() {
    return this.playlist.segments.reduce((a, x) => a + (x.end - x.begin) * x.loop, 0);
  }
}
</script>
