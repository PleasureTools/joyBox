import { EventBus as TsEventBus } from 'ts-bus';
import { Component, Vue } from 'vue-property-decorator';

const bus = new TsEventBus();

@Component
export default class EventBus extends Vue {
    public get EventBus() { return bus; }
}
