import { Component, Vue } from 'vue-property-decorator';

import Services from '@/services';

@Component
export default class RefsForwarding extends Vue {
    public get Services() { return Services; }
}
