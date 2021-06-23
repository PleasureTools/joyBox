import { Component, Vue } from 'vue-property-decorator';
import { getModule } from 'vuex-module-decorators';

import { env } from '../Env';
import store, { Access, App, Settings, SystemResources } from '../Store';

const app = getModule(App, store);
const access = getModule(Access, store);
const systemResources = getModule(SystemResources, store);
const settings = getModule(Settings, store);

@Component
export default class RefsForwarding extends Vue {
    public get App() { return app; }
    public get Access() { return access; }
    public get SystemResources() { return systemResources; }
    public get Settings() { return settings; }
    public get Env() { return env; }
}
