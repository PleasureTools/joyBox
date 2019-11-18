import * as chai from 'chai';
import * as mocha from 'mocha';

describe('RecordingService', () => {
    describe('String test', () => {
        it('should be a string', () => {
            chai.expect('Some text').to.be.a('string');
        });
    });
});
