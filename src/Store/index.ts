import Vue from 'vue';
import Vuex from 'vuex';

import App from './App';
import Notification from './Notification';
import Settings from './Settings';
import SystemResources from './SystemResources';

export { default as App } from './App';
export { default as SystemResources } from './SystemResources';
export { default as Notification } from './Notification';
export { default as Settings } from './Settings';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    app: App,
    systemResources: SystemResources,
    notification: Notification,
    settings: Settings
  }
});
