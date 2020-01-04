import * as chai from 'chai';
import * as mocha from 'mocha';

import { ThrottleEvent } from '../../backend/Src/Common/Event';

async function Delay(delay: number) {
    return new Promise(ok => setTimeout(() => ok(), delay));
}
describe('ThrottleEvent', () => {
    it('Duration', async () => {
        const duration = 10;
        const instance = new ThrottleEvent<number>(duration);
        const results: number[] = [];
        instance.On(x => results.push(x));

        instance.Emit(1);
        instance.Emit(2);
        instance.Emit(3);
        await Delay(2 * duration);
        instance.Emit(4);
        instance.Emit(5);
        chai.expect(results).to.eql([1, 4]);
    });
});
