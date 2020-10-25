import Vue from 'vue';
import VueRx from 'vue-rx';

import '@mdi/font/css/materialdesignicons.min.css';
import 'material-design-icons-iconfont/dist/material-design-icons.css';
import 'roboto-fontface/css/roboto/roboto-fontface.css';

import Vuetify from 'vuetify';
import 'vuetify/dist/vuetify.min.css';

import { RecycleScroller } from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';

import Component from 'vue-class-component';

import VueMeta from 'vue-meta';

import './index.css';

import App from './App.vue';
import router from './Router';
import store from './Store';

import SocketIO from 'socket.io-client';
import VueSocketIO from 'vue-socket.io';

import { Response as RpcResponse } from '@/Common';
import { RpcClientPlugin } from './Plugins/Rpc';

import { env } from '@/Env';
import { Theme } from './Theme';

import { ErrorHandler } from './ErrorHandler';

import { Rpc } from './RpcInstance';

import ServiceWorkerResponder from './ServiceWorkerResponder';

import { ConfirmDlgPlugin } from '@/Plugins/ConfirmDlg';
import { NotificationsPlugin } from '@/Plugins/Notifications';

const MOUNT_POINT = '#app';

Vue.config.errorHandler = ErrorHandler;

const socket = SocketIO(env.Host);
const rpc = new RpcClientPlugin(socket);

Rpc.instance = rpc;

Component.registerHooks([
  'beforeRouteEnter',
  'beforeRouteLeave',
  'beforeRouteUpdate' // for vue-router 2.2+
]);

Vue.mixin({
  beforeCreate() {
    const options = this.$options;
    if (options.rpc)
      this.$rpc = options.rpc;
    else if (options.parent && options.parent.$rpc)
      this.$rpc = options.parent.$rpc;
  }
});

Vue.use(VueRx);

Vue.use(Vuetify);
const vuetify = new Vuetify({ theme: Theme });
const MountPoint = () => document.querySelector(MOUNT_POINT);

Vue.use(ConfirmDlgPlugin, { el: MountPoint, vuetify });
Vue.use(NotificationsPlugin, { el: MountPoint, vuetify });

Vue.component('RecycleScroller', RecycleScroller);

Vue.use(new VueSocketIO({
  debug: process.env.NODE_ENV === 'development',
  connection: socket,
  vuex: {
    store,
    actionPrefix: 'SOCKET_',
    mutationPrefix: 'SOCKET_'
  }
}));

Vue.use(VueMeta);

if (env.Secure)
  new ServiceWorkerResponder(store);

new Vue({
  router,
  rpc,
  store,
  vuetify,
  sockets: {
    // https://www.npmjs.com/package/vue-socket.io#-component-level-usage
    rpc: (res: RpcResponse) => rpc.OnRpcResponse(res) // Handle SC data (all 'rpc' events)
  },
  render: h => h(App)
}).$mount(MOUNT_POINT);
