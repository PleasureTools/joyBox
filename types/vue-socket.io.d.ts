import Vue from 'vue'
import * as SocketIOClient from 'socket.io-client';

interface VueSocketIOConstructor {
    new(ctor: { connection: any, vuex?: any, debug?: any, options?: any }): VueSocketIO;
}

interface VueSocketIO {
    io: any;
    emitter: any;
    listener: any;

    install(vue: any): void;
    connect(connection: any, options: any): void;
}

declare module 'vue/types/vue' {
    interface Vue {
        $socket: SocketIOClient.Socket
        sockets: any;
    }
}

declare module "vue/types/options" {
    interface ComponentOptions<V extends Vue> {
        sockets?: any;
    }
}

declare const VueSocketIO: VueSocketIOConstructor;
export = VueSocketIO;