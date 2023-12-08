import express, { Application, NextFunction, Request, Response } from 'express';
import { Logger, morganMiddleware } from ".";
import { BaseException, InternalServerException } from './exception.config';
import container from '../backendmodule';

export const PORT = process.env.PORT || 3001;

export async function serverConfig(app: Application) {
    app.use(express.json());
    if (process.env.NODE_ENV !== "test") {
        app.use(morganMiddleware);
    }
    const cors = require('cors');
    app.use(cors({
        origin: '*'
    }));
}

export function serverErrorConfig(app: Application) {
    const logger = container.get<Logger>(Logger);
    // const logger = new Logger();
    app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
        if (err && err instanceof BaseException) {
            logger.error(err.message);
            return res.status(err.statusCode).json({ error: err });
        }

        if (err) {
            if (err.stack) {
                logger.error(err.stack);
            }
            return res.status(500).json(new InternalServerException(err.message));
        }

        next();
    });
}