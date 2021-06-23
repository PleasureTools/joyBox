import { AppAccessType } from '@Shared/Types';

export default [
    {
        path: 'file', component: () => import('@/Components/UploadVideo/LocalFile.vue'),
        meta: { access: AppAccessType.FULL_ACCESS }
    },
    {
        path: 'url', component: () => import('@/Components/UploadVideo/Url.vue'),
        meta: { access: AppAccessType.FULL_ACCESS }
    },
    {
        path: 'archive', component: () => import('@/Components/UploadVideo/Archive.vue'),
        meta: { access: AppAccessType.FULL_ACCESS }
    }
];
