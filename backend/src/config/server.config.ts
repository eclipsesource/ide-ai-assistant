import express, { Application, NextFunction, Request, Response } from 'express';
import { morganMiddleware } from ".";
import { BaseException, InternalServerException } from './exception.config';

export const PORT = process.env.PORT || 3001;

export async function serverConfig(app: Application) {
    app.use(express.json());
    app.use(morganMiddleware);
}

export function serverErrorConfig(app: Application) {
    app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
        if (err && err instanceof BaseException) {
            return res.status(err.statusCode).json(err);
        }

        if (err) {
            return res.status(500).json(new InternalServerException(err.message));
        }

        next();
    });
}