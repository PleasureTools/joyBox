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
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ './Pages/About.vue')
    }
  ]
});
