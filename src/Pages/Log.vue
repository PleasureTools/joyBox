<template>
  <div class="fill-height d-flex flex-column">
    <v-app-bar class="flex-grow-0" color="primary">
      <v-btn icon to="/System">
        <v-icon>arrow_back</v-icon>
      </v-btn>
      <v-toolbar-title>Logs</v-toolbar-title>
      <v-spacer></v-spacer>
      <NoConnectionIcon />
    </v-app-bar>
    <v-container class="container" v-if="HasLogs">
      <div class="wrapper">
        <GroupList :items="Logs">
          <template v-slot="{ item }">
            <span>{{ TimestampFormat(item.data.timestamp) }}</span>
            <span>{{ item.data.message }}</span>
          </template>
        </GroupList>
        <infinite-loading @infinite="infiniteHandler"></infinite-loading>
      </div>
    </v-container>
    <p v-else class="text-center font-weight-bold display-3 blue-grey--text text--lighten-4">No data</p>
  </div>
</template>

<style scoped>
.container {
  position: relative;
  flex: 100% 1 1;
}
.wrapper {
  position: absolute;
  overflow-y: scroll;
  overflow-x: hidden;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
</style>

<script lang="ts">
import df from 'dateformat';
import { Component, Mixins, Ref, Vue } from 'vue-property-decorator';

import GroupList from '@/Components/GroupList/GroupList.vue';
import NoConnectionIcon from '@/Components/NoConnectionIcon.vue';
import Initialize from '@/Mixins/Initialized';
import RefsForwarding from '@/Mixins/RefsForwarding';
import { NotificationType } from '@/Store/Notification';
import { LogItem } from '@Shared/Types';

/**
 * Map [group] to number.
 */
class GroupMapper {
  private nextGroupId = 1;
  private readonly groupToId = new Map<string, number>();
  public GetId(msg: string) {
    if (msg[0] === '[') {
      const groupStr = msg.substring(1, msg.indexOf(']'));
      return this.groupToId.get(groupStr) || (this.groupToId.set(groupStr, this.nextGroupId), this.nextGroupId++);
    } else {
      // For messages produced by system (not user)
      return 0;
    }
  }
}
interface InfiniteLoaderState {
  loaded(): void;
  complete(): void;
}
@Component({
  components: {
    GroupList,
    NoConnectionIcon
  }
})
export default class Log extends Mixins(RefsForwarding, Initialize) {
  private logs: LogItem[] = [];
  private readonly LOGS_PER_FETCH = 25;
  public async Initialized() {
    this.logs = await this.$rpc.FetchRecentLogs(Math.ceil(Date.now() / 1000), this.LOGS_PER_FETCH);
  }
  private get HasLogs() { return this.logs.length > 0; }
  private get Logs() {
    const gm = new GroupMapper();
    return this.logs
      .map((x, i) => ({ id: x.timestamp + x.message + i, group: gm.GetId(x.message), data: x }))
      .map(x => ({ ...x, data: { ...x.data, message: x.data.message.substring(x.data.message.indexOf(']') + 1) } }));
  }
  private TimestampFormat(timestamp: number) {
    return df(timestamp * 1000, 'dd:mm:yyyy HH:MM:ss');
  }
  private async infiniteHandler(state: InfiniteLoaderState) {
    const oldest = this.logs[this.logs.length - 1];
    const news = await this.$rpc.FetchRecentLogs(oldest.timestamp, this.LOGS_PER_FETCH);
    const newsIntersection = news.findIndex(x => x.timestamp === oldest.timestamp && x.message === oldest.message);
    if (newsIntersection === -1) {
      this.Notification.Show(
        {
          message: 'Detected consistency problem with logs. Refreshing page can fix it.',
          type: NotificationType.WARN
        });
      return;
    }

    this.logs = [...this.logs, ...news.slice(newsIntersection + 1)];

    news.length ? state.loaded() : state.complete();
  }
}
</script>