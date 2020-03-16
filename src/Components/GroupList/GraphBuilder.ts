import { gt } from 'binary-search-bounds';
import IntervalTree from 'node-interval-tree';

import { GroupListItem } from './Types';

type GroupId = number;
interface Range {
  start: number;
  stop: number;
}
interface RangeNode extends Range {
  group: number;
  track: number;
}
export class GraphBuilder<T> {
  private static RangesByStartComp(l: Range, r: Range) {
    return l.start - r.start;
  }
  private readonly rangesMap = new Map<GroupId, Range>();
  private trackCount: number = 0;
  private lookupTable: RangeNode[] = [];
  private repository = new IntervalTree<RangeNode>();
  public constructor(private items: Array<GroupListItem<T>>) {
    this.BuildRanges();
    this.BuildTracks();
    this.PopulateRepository();
  }
  public get TrackCount() {
    return this.trackCount;
  }
  public Query(idx: number, track: number) {
    return this.repository
      .search(idx, idx)
      .find(x => x.track === track) || null;
  }
  private BuildRanges() {
    this.items.forEach((x, i) => {
      const range = this.rangesMap.get(x.group);
      if (range) {
        range.stop = i;
      } else {
        const newRange: Range = { start: i, stop: i };
        this.rangesMap.set(x.group, newRange);
      }
    });
  }
  private BuildTracks() {
    this.lookupTable = [...this.rangesMap.entries()].map(x => ({ ...x[1], group: x[0], track: -1 }));
    this.lookupTable.sort(GraphBuilder.RangesByStartComp);

    const localLookup = [...this.lookupTable];

    for (let i = 0; i < localLookup.length; ++i, ++this.trackCount) {
      localLookup[i].track = this.trackCount;

      const needle: Range = { start: localLookup[i].stop, stop: -1 };
      while (true) {
        const foundIdx: number = gt(localLookup, needle, GraphBuilder.RangesByStartComp);

        if (foundIdx === -1 || foundIdx >= localLookup.length) break;

        localLookup[foundIdx].track = this.trackCount;
        needle.start = localLookup[foundIdx].stop;

        localLookup.splice(foundIdx, 1);
      }

    }
  }
  private PopulateRepository() {
    this.lookupTable.forEach(x => this.repository.insert(x.start, x.stop, x));
  }
}
