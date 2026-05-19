// src/types/index.ts

import 'express-session';

// Возвращаем сущность Пользователя, которую запрашивают репозитории
export interface User {
    id: number;
    username: string;
    password_hash: string;
    created_at: Date;
}

// Расширение типов сессии Express
declare module 'express-session' {
    interface SessionData {
        userId: number;
        username: string;
    }
}