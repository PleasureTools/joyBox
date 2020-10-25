import { Stream } from '@/types';
import { ValueNode } from '../BoolFilter';

export class ObservableValueNode extends ValueNode<Stream> {
    public DefaultComparator(input: Stream, filter: string): boolean {
        return input.uri
            .toLowerCase()
            .includes(filter.toLowerCase()) ||
            input.uri
                .toLowerCase()
                .split('')
                .filter(x => x >= 'a' && x <= 'z' || x >= 'A' && x <= 'Z')
                .join('')
                .includes(filter.toLowerCase());
    }
    public PropComparator(input: Stream, prop: string, filter: string): boolean {
        if (prop === 'url') return this.UrlTest(input, filter);
        else if (prop === 'seen') return this.LastSeenTest(input, filter);
        else if (prop === 'plugin') return this.PluginTest(input, filter);
        return false;
    }
    // TODO: Good place for reflection
    private UrlTest(input: Stream, filter: string) { return this.DefaultComparator(input, filter); }
    private TimeDiv(metric: string | undefined): number {
        if (metric === undefined || metric === 'd')
            return 86400000;
        else if (metric === 'm')
            return 2592000000;
        else if (metric === 'h')
            return 3600000;

        throw new Error('Unknown metric');
    }
    /***
     * Filter syntax: [< or >][days] or never
     * Examples:
     *  `seen:10` - last seen exactly 10 days ago
     *  `seen:>15h` - last seen more than 20 hours ago
     *  `seen:>20d` - last seen more than 20 days ago
     *  `seen:<30m` - last seen less than 30 months ago
     *  `seen:never` - never seen
     *  */
    private LastSeenTest(input: Stream, filter: string) {
        if (!filter.length)
            return false;

        if (input.lastSeen === -1)
            return filter === 'never';

        const disassembled = /^([<>])?(\d+)(h|d|m)?$/.exec(filter);

        if (!disassembled)
            return false;

        const elapsed = Math.round((Date.now() - input.lastSeen * 1000) / this.TimeDiv(disassembled[3]));
        const value = Number.parseInt(disassembled[2], 10);
        if (disassembled[1] === '<')
            return elapsed < value;
        else if (disassembled[1] === '>')
            return elapsed > value;
        else
            return value === elapsed;
    }
    private PluginTest(input: Stream, filter: string) {
        const activePlugin = input.plugins.find(x => x.enabled);
        return !!activePlugin && activePlugin.name.toLowerCase() === filter.toLowerCase();
    }
}
