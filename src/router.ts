import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
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
      path: '/404',
      component: () => import('./Pages/404.vue')
    },
    {
      path: '*',
      redirect: '/404'
    }
  ]
});
