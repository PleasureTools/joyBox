import { Component, Vue, Watch } from 'vue-property-decorator';
import { getModule } from 'vuex-module-decorators';

import store, { App } from '@/Store';

const app = getModule(App, store);

@Component
export default class Initialized extends Vue {
    private called = false;
    public Initialized() { }
    public mounted() {
        this.CallOnce();
    }
    @Watch('App.initialized')
    private async OnInitialize(val: boolean, old: boolean) {
        this.CallOnce();
    }
    private CallOnce() {
        if (app.initialized && !this.called) {
            this.Initialized();
            this.called = true;
        }
    }
}
