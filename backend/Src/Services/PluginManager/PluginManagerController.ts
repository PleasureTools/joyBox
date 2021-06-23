import { Observable } from '../../Common/Event';
import { PluginManager } from '../PluginManager';

export interface Disposable {
    Dispose(): void;
}
export interface Arbiter extends Disposable {
    readonly VoteEvent: Observable<void>;
    // False if plugin manager should be stopped, otherwise true;
    Decision(): boolean;
}
export class PluginManagerController {
    private arbiters = new Map<string, Arbiter>();
    public constructor(private manager: PluginManager) { }
    public AddArbiter(arbiter: Arbiter, id: string) {
        this.arbiters.set(id, arbiter);
        arbiter.VoteEvent.On(this.voteFn);
    }
    public RemoveArbiter(id: string) {
        const remove = this.arbiters.get(id);
        if (remove !== undefined) {
            remove.VoteEvent.Off(this.voteFn);
            remove.Dispose();

            this.arbiters.delete(id);

            this.Vote();
        }
    }
    public Find(id: string) { return this.arbiters.get(id) ?? null; }
    private voteFn = () => this.Vote();
    private Vote() {
        if ([...this.arbiters.values()].every(x => x.Decision()))
            this.manager.Resume()
        else
            this.manager.Pause()
    }
}
