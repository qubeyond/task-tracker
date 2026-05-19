// src/services/UserService.ts

import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/UserRepository.js';
import { User } from '../types/index.js';

export class UserService {
    private userRepository = new UserRepository();
    private saltRounds = 10;

    // Регистрация нового пользователя с проверкой на дубликаты
    public async registerUser(username: string, password: string): Promise<User> {
        const existingUser = await this.userRepository.findByUsername(username);
        if (existingUser) {
            throw new Error('Пользователь с таким именем уже существует.');
        }

        // Асинхронное хэширование пароля (Blowfish-основанный алгоритм)
        const passwordHash = await bcrypt.hash(password, this.saltRounds);
        return this.userRepository.create(username, passwordHash);
    }

    // Проверка учетных данных при входе (Аутентификация)
    public async authenticateUser(username: string, password: string): Promise<User | null> {
        const user = await this.userRepository.findByUsername(username);
        if (!user) return null;

        // Безопасное сравнение переданного пароля с хэшем из БД
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) return null;

        return user;
    }
}