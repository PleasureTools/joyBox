
import { Socket } from 'socket.io';

import { Exact, Snapshot } from '@Shared/Types';

export class Unicaster {
    public constructor(private client: Socket) { }
    public Snapshot<T>(snapshot: Exact<T, Snapshot>) {
        this.client.emit('Snapshot', snapshot);
    }
    public ProlongateSession(token: string) {
        this.client.emit('ProlongateSession', token);
    }
}
