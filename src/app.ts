// src/app.ts

import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import { AuthController } from './controllers/AuthController.js';
import { TaskController } from './controllers/TaskController.js';
import { requireAuth } from './middleware/auth.js';
import { validateBody, authSchema, createTaskSchema, updateStatusSchema, createSubtaskSchema } from './middleware/validation.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Стандартный и легковесный парсинг входящих данных
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настройка сессий в памяти (для продакшена обычно используют Redis/Postgres хранилище)
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secure_session_secret_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true в продакшене при использовании HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 день срок жизни сессии
    }
}));

// Инициализация контроллеров
const authController = new AuthController();
const taskController = new TaskController();

// Базовый роут проверки статуса
app.get('/', (_req, res) => {
    res.status(200).json({
        status: "success",
        message: "Task Tracker API успешно функционирует",
        architecture: "Domain-Driven Layered"
    });
});

// Маршруты аутентификации (Auth) с валидацией входных данных
app.post('/api/auth/register', validateBody(authSchema), authController.register);
app.post('/api/auth/login', validateBody(authSchema), authController.login);
app.post('/api/auth/logout', authController.logout);

// Маршруты задач (Защищены middleware requireAuth и валидацией DTO)
app.post('/api/tasks', requireAuth, validateBody(createTaskSchema), taskController.create);
app.get('/api/tasks', requireAuth, taskController.getAll);
app.get('/api/tasks/:id', requireAuth, taskController.getById);
app.put('/api/tasks/:id/status', requireAuth, validateBody(updateStatusSchema), taskController.updateStatus);
app.delete('/api/tasks/:id', requireAuth, taskController.deleteTask);

// Маршруты подзадач с валидацией
app.post('/api/tasks/:taskId/subtasks', requireAuth, validateBody(createSubtaskSchema), taskController.addSubtask);
app.put('/api/subtasks/:subtaskId', requireAuth, taskController.toggleSubtask);

app.listen(PORT, () => {
    console.log(`=== [Server] Трекер задач успешно запущен на порту ${PORT} ===`);
});