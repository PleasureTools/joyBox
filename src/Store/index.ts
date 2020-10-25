import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';

import Access from './Access';
import App from './App';
import Settings from './Settings';
import SystemResources from './SystemResources';

export { default as Access } from './Access';
export { default as App } from './App';
export { default as SystemResources } from './SystemResources';
export { default as Settings } from './Settings';

Vue.use(Vuex);
export interface StoreType {
  app: App;
  access: Access;
  systemResources: SystemResources;
  settings: Settings;
}
export default new Vuex.Store<StoreType>({
  modules: {
    app: App,
    access: Access,
    systemResources: SystemResources,
    settings: Settings
  },
  plugins: [createPersistedState({ paths: ['app.lastTimeArchiveVisit', 'access.token'] })]
});
