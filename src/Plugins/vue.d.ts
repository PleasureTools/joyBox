import Vue from 'vue';
import { RpcClientPlugin } from './Rpc';
declare module 'vue/types/vue' {
    interface Vue {
        $rpc: RpcClientPlugin;
    }
}
declare module "vue/types/options" {
    interface ComponentOptions<V extends Vue> {
        rpc?: RpcClientPlugin;
    }
}