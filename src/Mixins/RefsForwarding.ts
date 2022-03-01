import ClipSettings from '@/Store/ClipSettings';
import { Component, Vue } from 'vue-property-decorator';
import { getModule } from 'vuex-module-decorators';

import { Env, env } from '../Env';
import store, { Access, App, Settings, SystemResources } from '../Store';

const app = getModule(App, store);
const access = getModule(Access, store);
const systemResources = getModule(SystemResources, store);
const settings = getModule(Settings, store);
const clipSettings = getModule(ClipSettings, store);

@Component
export default class RefsForwarding extends Vue {
  public get App(): App { return app; }
  public get Access(): Access { return access; }
  public get SystemResources(): SystemResources { return systemResources; }
  public get Settings(): Settings { return settings; }
  public get Env(): Env { return env; }
  public get ClipSettings(): ClipSettings { return clipSettings; }
}
