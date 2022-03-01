/* eslint-disable @typescript-eslint/no-unused-expressions */
import * as chai from 'chai';
import * as mocha from 'mocha';

import { Merge, SizeStrToByte, SizeToByteMetric } from '@Shared/Util';

describe('Util', () => {
  describe('SizeStrToByte', () => {
    it('Byte', () => {
      chai.expect(SizeStrToByte('14')).to.equal(14);
    });

    it('Kilobyte', () => {
      chai.expect(SizeStrToByte('14kB')).to.equal(14000);
    });

    it('Megabyte', () => {
      chai.expect(SizeStrToByte('3MB')).to.equal(3000000);
    });

    it('Gigabyte', () => {
      chai.expect(SizeStrToByte('1.5GB')).to.equal(1500000000);
    });

    it('Terabyte', () => {
      chai.expect(SizeStrToByte('4TB')).to.equal(4000000000000);
    });

    it('Kilobit', () => {
      chai.expect(SizeStrToByte('7kbit')).to.equal(875);
    });

    it('Megabit', () => {
      chai.expect(SizeStrToByte('2000Mbit')).to.equal(250000000);
    });

    it('Gigabit', () => {
      chai.expect(SizeStrToByte('1Gbit')).to.equal(125000000);
    });

    it('Terabit', () => {
      chai.expect(SizeStrToByte('2Tbit')).to.equal(250000000000);
    });

    it('3626.3kbit', () => {
      chai.expect(SizeStrToByte('3626.3kbit')).to.equal(453288);
    });

    it('21248kB', () => {
      chai.expect(SizeStrToByte('21248kB')).to.equal(21248000);
    });

    it('Metric test 100MB', () => {
      chai.expect(SizeStrToByte('100', SizeToByteMetric.MB)).to.equal(100000000);
    });

    it('Incorrect input', () => {
      chai.expect(SizeStrToByte('kB')).to.be.NaN;
    });

    it('Incorrect input', () => {
      chai.expect(SizeStrToByte('MB10')).to.be.NaN;
    });
  });

  describe('Merge', () => {
    const numCmp = (l: number, r: number) => l < r;

    it('Base', () => {
      chai.expect(Merge(numCmp, [1, 4, 7], [2, 5, 8], [3, 6, 9, 10])).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('One array', () => {
      chai.expect(Merge(numCmp, [1, 2, 3, 4, 5])).to.deep.equal([1, 2, 3, 4, 5]);
    });

    it('Arrays with one elements', () => {
      chai.expect(Merge(numCmp, [1], [2], [3])).to.deep.equal([1, 2, 3]);
    });

    it('Has empty array', () => {
      chai.expect(Merge(numCmp, [], [2, 5, 8], [3, 6, 9, 10])).to.deep.equal([2, 3, 5, 6, 8, 9, 10]);
    });

    it('Has two empty arrays', () => {
      chai.expect(Merge(numCmp, [], [2, 5, 8], [])).to.deep.equal([2, 5, 8]);
    });

    const ascendingCmp = (l: number, r: number) => r < l;

    it('Ascending arrays', () => {
      chai.expect(Merge(ascendingCmp, [6, 4, 2, 0], [7, 5, 3, 1], [])).to.deep.equal([7, 6, 5, 4, 3, 2, 1, 0]);
    });

    const objCmp = (l: {a: number}, r: {a: number}) => l.a < r.a;

    it('Object', () => {
      chai.expect(Merge(objCmp, [{ a: 10 }, { a: 20 }, { a: 30 }], [{ a: 5 }, { a: 15 }, { a: 25 }])).to.deep
        .equal([{ a: 5 }, { a: 10 }, { a: 15 }, { a: 20 }, { a: 25 }, { a: 30 }]);
    });
  });
});
