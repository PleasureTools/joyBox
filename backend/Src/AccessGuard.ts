import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

export class AccessGuard {
    public constructor(private accessToken: string) { }
    public Handler(req: Request, res: Response, next: NextFunction) {
        try {
            jwt.verify(req.query.token, this.accessToken);
            next();
        } catch (e) {
            res.status(403).end();
        }
    }
    public get Middleware() { return this.Handler.bind(this); }
}
