interface Request {
    callId: number;
    method: string;
    args: any[];
}

export interface Response {
    callId: number;
    result: {};
}

interface PendingRequest {
    callId: number;
    timeoutTimer: number;
    fn: any;
}

export class RpcClient {
    private readonly RPC = 'rpc';
    private callId: number = 0;
    private pendingRequests: PendingRequest[] = [];
    constructor(private socket: SocketIOClient.Socket, private responseTimeout: number = 1000) { }

    public OnRpcResponse(res: Response): void {
        const found = this.pendingRequests.findIndex(x => x.callId === res.callId);

        if (found === -1)
            return;

        const requestor = this.pendingRequests[found];

        clearTimeout(requestor.timeoutTimer);
        this.pendingRequests.splice(found, 1);

        requestor.fn(res.result);
    }

    protected GetCallId(): number {
        return ++this.callId ^ Date.now();
    }

    protected RemovePendingRequest(callId: number) {
        const found = this.pendingRequests.findIndex(x => x.callId === callId);
        if (found === -1)
            return;

        this.pendingRequests.splice(found, 1);
    }

    /**
     * Call remote function. throw
     * @param method method name
     * @param args arguments passed to method
     */
    protected async Call<Args extends any[], Ret>(method: string, ...args: Args): Promise<Ret> {
        return new Promise((resolve, reject) => {
            const req: Request = { method, callId: this.GetCallId(), args };

            this.socket.emit(this.RPC, req);

            const timeoutTimer = setTimeout(() => {
                this.RemovePendingRequest(req.callId);
                reject(new Error(`Method call '${method}' timed out.`));
            }, this.responseTimeout);

            this.pendingRequests.push({ callId: req.callId, timeoutTimer, fn: resolve });
        });
    }
}
