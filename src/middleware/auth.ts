// src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    if (!req.session || !req.session.userId) {
        res.status(401).json({
            status: 'error',
            message: 'Отказ в доступе. Необходима авторизация.'
        });
        return;
    }
    next();
}