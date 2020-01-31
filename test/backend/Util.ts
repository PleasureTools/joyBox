import * as chai from 'chai';
import * as mocha from 'mocha';

import { SizeStrToByte, SizeToByteMetric } from '@Shared/Util';

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
});
