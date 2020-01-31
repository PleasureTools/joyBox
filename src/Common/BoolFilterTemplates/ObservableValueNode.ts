import { Stream } from '@/types';
import { ValueNode } from '../BoolFilter';

export class ObservableValueNode extends ValueNode<Stream> {
    public DefaultComparator(input: Stream, filter: string): boolean {
        return input.uri.toLowerCase().includes(filter.toLowerCase());
    }
    public PropComparator(input: Stream, prop: string, filter: string): boolean {
        if (prop === 'url') return this.UrlTest(input, filter);
        else if (prop === 'seen') return this.LastSeenTest(input, filter);
        else if (prop === 'plugin') return this.PluginTest(input, filter);
        return false;
    }
    // TODO: Good place for reflection
    private UrlTest(input: Stream, filter: string) { return this.DefaultComparator(input, filter); }
    /***
     * Filter syntax: [< or >][days] or never
     * Examples:
     *  `seen:10` - last seen exactly 10 days ago
     *  `seen:>20` - last seen more than 20 days ago
     *  `seen:<30` - last seen less than 30 days ago
     *  `seen:never` - never seen
     *  */
    private LastSeenTest(input: Stream, filter: string) {
        if (!filter.length)
            return false;

        if (input.lastSeen === -1)
            return filter === 'never';

        const elapsed = Math.round((Date.now() - input.lastSeen * 1000) / 86400000);
        if (filter[0] === '<') {
            const filterVal = Number.parseInt(filter.substr(1), 10);

            if (Number.isNaN(filterVal))
                return false;

            return elapsed < filterVal;
        } else if (filter[0] === '>') {
            const filterVal = Number.parseInt(filter.substr(1), 10);

            if (Number.isNaN(filterVal))
                return false;

            return elapsed > filterVal;
        } else {
            const filterVal = Number.parseInt(filter, 10);
            return !Number.isNaN(filterVal) && filterVal === elapsed;
        }
    }
    private PluginTest(input: Stream, filter: string) {
        const activePlugin = input.plugins.find(x => x.enabled);
        return !!activePlugin && activePlugin.name.toLowerCase() === filter.toLowerCase();
    }
}
