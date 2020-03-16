import { ObservableStream, Plugin } from './Common/Types';
export class StreamDispatcher {
    private readonly UNASSIGNED_PLUGIN_ID = -1; // place where observables fall into that have no active plugin
    private pluginStreams: Map<number, Set<string>> = new Map();

    constructor(private observables: Map<string, ObservableStream>) {
        this.pluginStreams.set(this.UNASSIGNED_PLUGIN_ID, new Set<string>());
    }

    public Initialize() {
        this.observables.forEach(x => {
            const plugin = this.GetActivePlugin(x.url);

            // Unknown url or no available plugin
            if (plugin === null) {
                return;
            }

            const linkedObservable = this.pluginStreams.get(plugin.id);

            if (linkedObservable === undefined) {
                throw new Error(`Missing linked plugin '${plugin.name}' for '${x.url}'`);
            }

            linkedObservable.add(x.url);
        });
    }

    public AddPlugin(plugin: number, observables: Set<string>) {
        this.pluginStreams.set(plugin, observables);
    }

    public Add(url: string): boolean {
        const plugin = this.GetActivePlugin(url);

        if (plugin === null) {
            return false;
        }

        const pluginObservables = this.pluginStreams.get(plugin.id);

        if (pluginObservables === undefined) {
            return false;
        }

        pluginObservables.add(url);
        return true;
    }

    public Remove(url: string) {
        const plugin = this.GetActivePlugin(url);

        if (plugin === null) {
            return false;
        }

        const pluginObservables = this.pluginStreams.get(plugin.id);

        if (pluginObservables === undefined) {
            return false;
        }

        return pluginObservables.delete(url);
    }

    public Move(url: string, source: number, dest: number): boolean {
        const sourcePluginObservables = this.pluginStreams.get(source);

        if (sourcePluginObservables === undefined || !sourcePluginObservables.delete(url)) {
            return false;
        }

        const destPluginObservable = this.pluginStreams.get(dest);

        if (destPluginObservable === undefined) {
            return false;
        }

        destPluginObservable.add(url);
        return true;
    }

    public RedistributeFromDisabledPlugin(pluginId: number) {
        const relocatableObservables = this.pluginStreams.get(pluginId);

        if (relocatableObservables === undefined) {
            return;
        }

        relocatableObservables.forEach(x => {
            const newLocation = this.GetActivePlugin(x);

            if (newLocation === null) {
                return;
            }

            this.Move(x, pluginId, newLocation.id);
        });

        if (relocatableObservables.size === 0)
            return;

        relocatableObservables.forEach(uo => this.Move(uo, pluginId, this.UNASSIGNED_PLUGIN_ID));
    }

    public RedistributeToEnabledPlugin(pluginId: number) {
        [...this.pluginStreams]
            .flatMap(([p, o]) => [...o].map(o => ({ o, p })))
            .forEach(x => {
                const active = this.GetActivePlugin(x.o);

                if (active !== null && active.id === pluginId) {
                    this.Move(x.o, x.p, pluginId);
                }
            });
    }

    public GetActivePlugin(url: string): Plugin | null {
        const target = this.observables.get(url) || null;
        return target && target.plugins.find(x => x.enabled) || null;
    }
}
