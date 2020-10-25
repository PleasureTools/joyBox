import _Vue from 'vue';
import Vuetify from 'vuetify';

import Notification from './View.vue';

import { NotificationType } from './Types';

interface NotificationsOptions {
    vuetify: typeof Vuetify;
    el(): HTMLElement;
}
export class NotificationApi {
    public constructor(private options: NotificationsOptions) { }
    public Show(message: string, type: NotificationType = NotificationType.INFO) {
        const component: Notification = new Notification({
            propsData: { message, type },
            vuetify: this.options.vuetify,
            destroyed: () => this.Destroyed(component)
        });

        this.options.el().appendChild(component.$mount().$el);
    }
    private Destroyed(cmp: Notification) {
        this.options.el().removeChild(cmp.$el);
    }
}
export function NotificationsPlugin(Vue: typeof _Vue, options: NotificationsOptions) {
    Vue.prototype.$notification = new NotificationApi(options);
}
