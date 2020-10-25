import Vue from 'vue';
import { NotificationApi } from './index';
declare module 'vue/types/vue' {
    interface Vue {
        $notification: NotificationApi;
    }
}
declare module "vue/types/options" {
    interface ComponentOptions<V extends Vue> {
        notification?: NotificationApi;
    }
}