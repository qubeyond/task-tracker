// src/repositories/UserRepository.ts

import { pool } from '../infrastructure/database.js';
import { User } from '../types/index.js';

export class UserRepository {
    // Поиск пользователя по его уникальному имени (username)
    public async findByUsername(username: string): Promise<User | null> {
        const query = 'SELECT id, username, password_hash, created_at FROM users WHERE username = $1';
        const { rows } = await pool.query(query, [username]);

        if (rows.length === 0) return null;

        return {
            id: rows[0].id,
            username: rows[0].username,
            password_hash: rows[0].password_hash,
            created_at: rows[0].created_at
        };
    }

    // Сохранение нового пользователя в базу данных
    public async create(username: string, passwordHash: string): Promise<User> {
        const query = `
            INSERT INTO users (username, password_hash) 
            VALUES ($1, $2) 
            RETURNING id, username, password_hash, created_at
        `;
        const { rows } = await pool.query(query, [username, passwordHash]);

        return {
            id: rows[0].id,
            username: rows[0].username,
            password_hash: rows[0].password_hash,
            created_at: rows[0].created_at
        };
    }
}