import { Subject } from 'rxjs';
import { first } from 'rxjs/operators';
import {
    Action,
    Module,
    Mutation,
    VuexModule,
} from 'vuex-module-decorators';

import { Rpc } from '@/RpcInstance';
import { AppAccessType, Snapshot } from '@Shared/Types';

@Module({ namespaced: true, name: 'access' })
export default class Access extends VuexModule {
    public dialogShown = false;
    public defaultAccess = AppAccessType.NO_ACCESS;
    public access = AppAccessType.NO_ACCESS;
    public token = '';
    private OnGrantAcces = new Subject<boolean>();
    @Mutation
    public SOCKET_disconnect() {
        this.access = AppAccessType.NO_ACCESS;
    }
    @Mutation
    public SOCKET_Snapshot(snapshot: Snapshot) {
        this.defaultAccess = snapshot.defaultAccess;
        this.access = snapshot.defaultAccess;
    }
    @Mutation
    public ShowDlg() {
        this.dialogShown = true;
    }
    @Mutation
    public CloseDlg() {
        this.dialogShown = false;
        this.OnGrantAcces.next(this.access > this.defaultAccess);
    }
    @Mutation
    public SOCKET_ProlongateSession(token: string) {
        this.token = token;
    }
    @Mutation
    public GrantFullAccess() {
        this.access = AppAccessType.FULL_ACCESS;
        this.OnGrantAcces.next(this.access > this.defaultAccess);
    }
    @Mutation
    public InvalidateToken() { this.token = ''; }
    @Mutation
    public SetAccessToken(token: string) { this.token = token; }
    @Action
    public async TryUpgrade() {
        if (this.HasAccessToken) {
            await Rpc.instance?.UpgradeAccess(this.token) ?
                this.GrantFullAccess() :
                this.InvalidateToken();
        }
    }
    @Action
    public async RequestPassphrase() {
        this.ShowDlg();
        return new Promise<boolean>(ret => {
            this.OnGrantAcces
                .pipe(first())
                .subscribe(x => ret(x));
        });
    }
    @Action
    public async AwaitAccessUpgrade(timeout: number) {
        return this.FullAccess || !this.HasAccessToken ? Promise.resolve() :
            new Promise<void>(ret => {
                const tid = setTimeout(() => ret(), timeout);
                this.OnGrantAcces
                    .pipe(first())
                    .subscribe(x => (clearTimeout(tid), ret()));
            });
    }
    public get FullAccess() { return this.access === AppAccessType.FULL_ACCESS; }
    public get NoAccess() { return this.access === AppAccessType.NO_ACCESS; }
    public get NonFullAccess() { return this.access !== AppAccessType.FULL_ACCESS; }
    public get HasAccessToken() { return this.token.length > 0; }
}
