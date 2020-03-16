import Vue from 'vue';
import { default as Router, Route } from 'vue-router';
import { getModule } from 'vuex-module-decorators';

import store, { App, Notification } from '@/Store';
import { NotificationType } from '@/Store/Notification';

Vue.use(Router);

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      component: () => import('./Pages/Dashboard.vue')
    },
    {
      path: '/observables',
      component: () => import('./Pages/Observables.vue')
    },
    {
      path: '/archive',
      component: () => import('@/Pages/Archive.vue')
    },
    {
      path: '/system',
      component: () => import('./Pages/System.vue')
    },
    {
      path: '/recorder',
      component: () => import('./Pages/Recorder.vue')
    },
    {
      path: '/player/:filename',
      component: () => import('./Pages/Player.vue')
    },
    {
      path: '/clip/:filename',
      component: () => import('./Pages/Clip.vue')
    },
    {
      path: '/log',
      component: () => import('./Pages/Log.vue')
    },
    {
      path: '/404',
      component: () => import('./Pages/404.vue')
    },
    {
      path: '*',
      redirect: '/404'
    }
  ]
});

const app = getModule(App, store);
const notification = getModule(Notification, store);

router.beforeEach((to: Route, from: Route, next) => {
  if (app.initialized && app.NoAccess && to.path !== '/dashboard') {
    notification.Show({ message: 'No access', type: NotificationType.ERR });
    next('/');
  } else {
    next();
  }
});

export default router;
