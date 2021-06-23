
import { Socket } from 'socket.io';

import { Exact, AppStateSnapshot } from '@Shared/Types';

export class Unicaster {
    public constructor(private client: Socket) { }
    public Snapshot<T>(snapshot: Exact<T, AppStateSnapshot>) {
        this.client.emit('Snapshot', snapshot);
    }
    public ProlongateSession(token: string) {
        this.client.emit('ProlongateSession', token);
    }
}
