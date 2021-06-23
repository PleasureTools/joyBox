import Levenshtein from 'fast-levenshtein';

import { SerializedArchiveRecord as ArchiveRecord } from '@Shared/Types';
import { SizeStrToByte, SizeToByteMetric as M } from '@Shared/Util';
import { ExtractSourceFromUrl } from '../../Common/Util';
import { ValueNode } from '../BoolFilter';

export class ArchiveValueNode extends ValueNode<ArchiveRecord> {
    public DefaultComparator(input: ArchiveRecord, filter: string): boolean {
        return input.title.toLowerCase().includes(filter.toLowerCase()) || this.TagTest(input, filter);
    }
    public PropComparator(input: ArchiveRecord, prop: string, filter: string): boolean {
        if (prop === 'title') return this.TitleTest(input, filter);
        else if (prop === 'source') return this.SourceTest(input, filter);
        else if (prop === 'size') return this.SizeTest(input, filter);
        else if (prop === 'len') return this.DurationTest(input, filter);
        return false;
    }
    private TagTest(input: ArchiveRecord, filter: string) {
        const filterLc = filter.toLowerCase();
        return input.tags.some(t => Levenshtein.get(t, filterLc) <= Math.min(Math.ceil(filter.length / 5), 4));
    }
    private TitleTest(input: ArchiveRecord, filter: string) { return this.DefaultComparator(input, filter); }
    private SourceTest(input: ArchiveRecord, filter: string) {
        return ExtractSourceFromUrl(input.source.toLowerCase()) === filter.toLowerCase();
    }
    /**
     * Filter syntax: [< or >][size][, kB, MB(default), GB, TB]
     * Examples:
     *  `size:100` - equal 100 megabytes
     *  `size:>2GB` - greater than 2 gigabytes
     *  `size:<200MB` - less than 200 megabytes
     */
    private SizeTest(input: ArchiveRecord, filter: string) {
        if (!filter.length)
            return false;

        if (filter[0] === '<') {
            const size = SizeStrToByte(filter.substr(1), M.MB);

            if (Number.isNaN(size))
                return false;

            return input.size < size;
        } else if (filter[0] === '>') {
            const size = SizeStrToByte(filter.substr(1), M.MB);

            if (Number.isNaN(size))
                return false;

            return input.size > size;
        } else {
            const size = SizeStrToByte(filter, M.MB);
            return !Number.isNaN(size) && input.size === size;
        }
    }
    /**
     * Filter syntax: [< or >][duration in minutes]
     * Examples:
     *  len:60 - exact 1 hour
     *  len:>30 - greater than 30 minutes
     *  len:<40 - less tahn 40 minutes
     */
    private DurationTest(input: ArchiveRecord, filter: string) {
        if (!filter.length)
            return false;

        if (filter[0] === '<') {
            const duration = Number.parseFloat(filter.substr(1)) * 60;

            if (Number.isNaN(duration))
                return false;

            return input.duration < duration;
        } else if (filter[0] === '>') {
            const duration = Number.parseFloat(filter.substr(1)) * 60;

            if (Number.isNaN(duration))
                return false;

            return input.duration > duration;
        } else {
            const duration = Number.parseFloat(filter) * 60;
            return !Number.isNaN(duration) && input.duration === duration;
        }
    }
}
