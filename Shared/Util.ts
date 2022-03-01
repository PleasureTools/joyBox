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

export function Clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(x, lo));
}

export function Merge<T>(comparator: (l: T, r: T) => boolean, ...arrays: T[][]): T[] {
  const it: number[] = new Array(arrays.length).fill(0, 0, arrays.length);
  let minIdx = 0;
  const ret: T[] = [];
  while (minIdx !== -1) {
    minIdx = arrays.findIndex((x, i) => it[i] < x.length);

    for (let n = 0; n < arrays.length; ++n) {
      if (it[n] < arrays[n].length && comparator(arrays[n][it[n]], arrays[minIdx][it[minIdx]])) {
        minIdx = n;
      }
    }

    if (minIdx !== -1) {
      ret.push(arrays[minIdx][it[minIdx]]);
      ++it[minIdx];
    }
  }

  return ret;
}
