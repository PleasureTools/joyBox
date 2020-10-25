import { Event } from '../Common/Event';
import { Plugin } from '../Common/Types';
import { LiveStream, LocatorService } from '../Plugins/Plugin';

export class PluginManager {
    private plugins: Plugin[] = [];
    private liveStreamEvent: Event<LiveStream> = new Event();
    private isRunning = false;
    public get IsRunning() { return this.isRunning; }
    get Plugins(): Plugin[] {
        return this.plugins;
    }

    public get LiveStreamEvent() {
        return this.liveStreamEvent;
    }

    public Register(name: string, service: LocatorService): Plugin {
        service.LiveStreamEvent.On((e: LiveStream) => this.liveStreamEvent.Emit(e));
        return this.plugins[this.plugins.push({ id: -1, enabled: true, name, service }) - 1];
    }

    public FindPlugin(name: string): Plugin | null {
        return this.plugins.find(x => x.name === name) || null;
    }

    public FindPluginById(id: number): Plugin | null {
        return this.plugins.find(x => x.id === id) || null;
    }

    public FindCompatiblePlugin(uri: string): Plugin[] {
        return this.plugins.filter(x => x.service.CanParse(uri));
    }

    public ReorderPlugin(index: number, newIndex: number) {
        this.plugins.splice(newIndex, 0, this.plugins.splice(index, 1)[0]);
    }

    public EnablePlugin(id: number, enabled: boolean) {
        const plugin = this.FindPluginById(id);

        if (plugin === null || plugin.enabled === enabled) {
            return;
        }

        plugin.enabled = enabled;

        enabled ?
            plugin.service.Start() :
            plugin.service.Stop();
    }

    /**
     * @param orderMap contain plugins ids in new order
     */
    public ReorderPlugins(newOrder: number[]): void {
        const orderMap = new Map(newOrder.map((x, p) => [x, p]));
        const priv = (p: Plugin) => orderMap.get(p.id) || -1;
        this.plugins.sort((a, b) => priv(a) - priv(b));
    }

    public Start(): void {
        if (!this.isRunning) {
            this.isRunning = true;
            this.plugins.filter(x => x.enabled).forEach(x => x.service.Start());
        }
    }

    public Stop(): void {
        if (this.isRunning) {
            this.isRunning = false;
            this.plugins.forEach(x => x.service.Stop());
        }
    }
}
