import Vue, { ComponentOptions } from 'vue';
import { Component } from 'vue-property-decorator';

import { AppThemeColor } from '../../MetaInfo';

export function AppComponent<V extends Vue>(options: ComponentOptions<V> & ThisType<V>) {
    return Component({
        metaInfo() {
            return {
                meta: [
                    AppThemeColor(this.$vuetify)
                ]
            };
        },
        ...options
    });
}
