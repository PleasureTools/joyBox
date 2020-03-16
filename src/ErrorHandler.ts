import { Vue } from 'vue/types/vue';

export function ErrorHandler(error: Error, vm: Vue, info: string) {
    console.error(error);
}
