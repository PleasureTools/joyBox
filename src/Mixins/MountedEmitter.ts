import { Component, Emit, Vue } from 'vue-property-decorator';

@Component
export default class MountedEmitter extends Vue {
    @Emit('mounted') public Mounted() { }
    public mounted() { this.Mounted(); }
}
