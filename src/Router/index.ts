import Vue from 'vue';
import Router, { Route } from 'vue-router';
import { getModule } from 'vuex-module-decorators';

import store, { Access, App } from '@/Store';
import { AppAccessType } from '@Shared/Types';
import analytics from './analytics';
import Playlist from './Playlist';
import UploadVideo from './UploadVideo';

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
      component: () => import('@/Pages/Dashboard.vue'),
      meta: { access: AppAccessType.NO_ACCESS }
    },
    {
      path: '/observables',
      component: () => import('@/Pages/Observables.vue'),
      meta: { access: AppAccessType.VIEW_ACCESS }
    },
    {
      path: '/archive',
      component: () => import('@/Pages/Archive.vue'),
      meta: { access: AppAccessType.VIEW_ACCESS }
    },
    {
      path: '/system',
      component: () => import('@/Pages/System.vue'),
      meta: { access: AppAccessType.VIEW_ACCESS }
    },
    {
      path: '/recorder',
      component: () => import('@/Pages/Recorder.vue'),
      meta: { access: AppAccessType.VIEW_ACCESS }
    },
    {
      path: '/live/:provider/:channel',
      component: () => import('@/Pages/Live.vue'),
      meta: { access: AppAccessType.VIEW_ACCESS }
    },
    {
      path: '/player/playlist_(\\d+)',
      component: () => import('@/Pages/PlaylistPlayer.vue'),
      meta: { access: AppAccessType.VIEW_ACCESS }
    },
    {
      path: '/player/:filename',
      component: () => import('@/Pages/Player.vue'),
      meta: { access: AppAccessType.VIEW_ACCESS }
    },
    {
      path: '/clip/:filename',
      component: () => import('@/Pages/Clip.vue'),
      meta: { access: AppAccessType.FULL_ACCESS }
    },
    {
      path: '/log',
      component: () => import('@/Pages/Log.vue'),
      meta: { access: AppAccessType.VIEW_ACCESS }
    },
    {
      path: '/playlist',
      component: () => import('@/Pages/Playlist.vue'),
      redirect: '/playlist/new',
      children: Playlist
    },
    {
      path: '/analytics',
      component: () => import('@/Pages/Analytics.vue'),
      redirect: '/analytics/space_usage',
      children: analytics
    },
    {
      path: '/upload_video',
      component: () => import('@/Pages/UploadVideo.vue'),
      redirect: '/upload_video/file',
      children: UploadVideo,
      meta: { access: AppAccessType.FULL_ACCESS }
    },
    {
      path: '/404',
      component: () => import('@/Pages/404.vue')
    },
    {
      path: '*',
      redirect: '/404'
    }
  ]
});

const app = getModule(App, store);
const access = getModule(Access, store);

router.beforeEach(async (to: Route, from: Route, next) => {
  if (to.path === '/dashboard') {
    next();
    return;
  }

  try {
    await app.AwaitInitialization(1000);
    if (to.meta?.access <= access.access) {
      next();
      return;
    }
    await access.AwaitAccessUpgrade(500);

    if (to.meta?.access > access.access && to.path !== '/dashboard') {
      await access.RequestPassphrase() ? next() : next('/');
    } else {
      next();
    }
  } catch (e) {
    next('/');
  }
});

export default router;
