import { NextFunction, Request, Response } from 'express';

export class AccessGuard {
    private passphrase: string = '';
    public SetPassphrase(passphrase: string) {
        this.passphrase = passphrase;
    }
    public Handler(req: Request, res: Response, next: NextFunction) {
        if (req.query.passphrase === this.passphrase)
            next();
        else
            res.status(403).end();
    }
    public get Middleware() { return this.Handler.bind(this); }
}
