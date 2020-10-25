import { Store } from 'vuex';

import Services from '@/services';
import { StoreType } from '@/Store';
import { AppAccessType } from '@Shared/Types';

export default class ServiecWorkerResponder {
    public constructor(private store: Store<StoreType>) {
        navigator.serviceWorker.addEventListener('message', this.accessTokenRqFn);
        this.store
            .watch(() => this.store.state.access.token, (val: string, old: string) => this.TokenChanged(val, old));
    }
    public Dispose() {
        navigator.serviceWorker.removeEventListener('message', this.accessTokenRqFn);
    }
    private accessTokenRqFn = (e: MessageEvent) => this.OnAccessTokenRequest(e);
    private TokenChanged(val: string, old: string) {
        const msg = val === '' ?
            { type: 'invalidate_token' } :
            { type: 'auth_req', token: val };
        Services.serviceWorker.Instacnce?.active?.postMessage(msg);
    }
    private OnAccessTokenRequest(e: MessageEvent) {
        if (e.data === 'auth_req') {
            if (this.store.state.access.defaultAccess === AppAccessType.NO_ACCESS)
                (e.source as MessagePort).postMessage({ type: 'auth_req', token: this.store.state.access.token });
            else
                (e.source as MessagePort).postMessage({ type: 'auth_free' });
        }
    }
}
