// src/controllers/AuthController.ts

import { Request, Response } from 'express';
import { UserService } from '../services/UserService.js';

export class AuthController {
    private userService = new UserService();

    public register = async (req: Request, res: Response): Promise<void> => {
        try {
            const { username, password } = req.body;

            // Диагностический лог входящих данных
            console.log('=== [DEBUG] Получен запрос на регистрацию ===', { username, password });

            if (!username || !password) {
                res.status(400).json({
                    status: 'error',
                    message: 'Имя пользователя и пароль обязательны. Данные не дошли до парсера.'
                });
                return;
            }

            const user = await this.userService.registerUser(username, password);
            res.status(201).json({
                status: 'success',
                message: 'Пользователь успешно зарегистрирован',
                data: { id: user.id, username: user.username }
            });
        } catch (error: any) {
            // Превращаем ошибку в подробный JSON для клиента
            res.status(400).json({
                status: 'error',
                message: error?.message || 'Свойство message пустое',
                stringified: String(error),
                stack: error?.stack || 'Трассировка стека отсутствует'
            });
        }
    };

    public login = async (req: Request, res: Response): Promise<void> => {
        try {
            const { username, password } = req.body;
            const user = await this.userService.authenticateUser(username, password);

            if (!user) {
                res.status(401).json({ status: 'error', message: 'Неверное имя пользователя или пароль.' });
                return;
            }

            // Записываем данные в сессию
            req.session.userId = user.id;
            req.session.username = user.username;

            res.status(200).json({
                status: 'success',
                message: 'Авторизация выполнена успешно',
                data: { id: user.id, username: user.username }
            });
        } catch (error: any) {
            console.error("=== КРИТИЧЕСКАЯ ОШИБКА В КОНТРОЛЛЕРЕ ===", error);
            res.status(500).json({
                status: 'error',
                message: error.message || 'Неизвестная ошибка',
                details: error
            });
        }
    };

    public logout = (req: Request, res: Response): void => {
        req.session.destroy((err) => {
            if (err) {
                res.status(500).json({ status: 'error', message: 'Не удалось завершить сессию.' });
                return;
            }
            res.clearCookie('connect.sid'); // Удаляем куку сессии на клиенте
            res.status(200).json({ status: 'success', message: 'Выход из системы успешно выполнен.' });
        });
    };
}