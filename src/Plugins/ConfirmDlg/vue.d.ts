import Vue from 'vue';
import { ConfirmDlgApi } from './index';
declare module 'vue/types/vue' {
    interface Vue {
        $confirm: ConfirmDlgApi;
    }
}
declare module "vue/types/options" {
    interface ComponentOptions<V extends Vue> {
        confirm?: ConfirmDlgApi;
    }
}