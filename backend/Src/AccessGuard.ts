import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
class ProcessingError {
    public constructor(public reponseCode: number) { }
}
export class AccessGuard {
    public constructor(private secret: string) { }
    public Handler(req: Request, res: Response, next: NextFunction) {
        try {
            const token = req.header('Authorization');

            if (!token)
                throw new ProcessingError(400);

            try {
                jwt.verify(token, this.secret);
            } catch (e) {
                throw new ProcessingError(401);
            }
            next();
        } catch (e) {
            if (e instanceof ProcessingError)
                res.status((e as ProcessingError).reponseCode).end();
        }
    }
    public get Middleware() { return this.Handler.bind(this); }
}
