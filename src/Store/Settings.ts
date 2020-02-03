import {
    Module,
    Mutation,
    VuexModule,
} from 'vuex-module-decorators';

@Module({ namespaced: true, name: 'settings' })
export default class Settings extends VuexModule {
    public webPushAvailable: boolean = false;
    public webPushEnabled: boolean = false;
    @Mutation
    public WebPushAvailable(val: boolean) {
        this.webPushAvailable = val;
    }
    @Mutation
    public WebPushEnabled(val: boolean) {
        this.webPushEnabled = val;
    }
}
