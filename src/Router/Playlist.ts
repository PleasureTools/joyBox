/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { AppAccessType } from '@Shared/Types';

export default [
  {
    path: 'new',
    name: 'playlist.new',
    props: true,
    component: () => import('@/Components/Playlist/NewPlaylist.vue'),
    meta: { access: AppAccessType.FULL_ACCESS }
  }
];
