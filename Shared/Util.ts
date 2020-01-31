export enum SizeToByteMetric { BYTE = 'B', KB = 'k', MB = 'M', GB = 'G', TB = 'T' }
/**
 * Parse size string like 300kB to bytes
 * @param size string contain size
 * @returns Rounded number of bytes or NaN
 */
export function SizeStrToByte(size: string, defaultMetric: SizeToByteMetric = SizeToByteMetric.BYTE): number {
    if (typeof size !== 'string') {
        return NaN;
    }

    const MetricMult = (m: string): number => {
        return Math.pow(1000, [
            SizeToByteMetric.BYTE,
            SizeToByteMetric.KB,
            SizeToByteMetric.MB,
            SizeToByteMetric.GB,
            SizeToByteMetric.TB].findIndex(x => x === m));
    };

    return Math.ceil(size.endsWith('bit') ?
        Number.parseFloat(size) * MetricMult(size[size.length - 4]) / 8 :
        size.endsWith('B') ?
            Number.parseFloat(size) * MetricMult(size[size.length - 2]) :
            Number.parseFloat(size) * MetricMult(defaultMetric));
}
