// src/infrastructure/database.ts

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    throw new Error('Критическая ошибка: Переменная окружения DATABASE_URL не задана в файле .env');
}

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
});

pool.on('connect', () => {
    console.log('--- [Database] Новое соединение установлено с PostgreSQL ---');
});

pool.on('error', (err) => {
    console.error('--- [Database] Критическая ошибка пула соединений ---', err);
});