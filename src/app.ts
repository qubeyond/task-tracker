// src/app.ts

import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import { AuthController } from './controllers/AuthController.js';
import { TaskController } from './controllers/TaskController.js';
import { requireAuth } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware для парсинга JSON
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

// Маршруты аутентификации (Auth)
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/logout', authController.logout);

// Маршруты задач (Защищены middleware requireAuth)
app.get('/api/tasks', requireAuth, taskController.getAll);
app.put('/api/tasks/:id/status', requireAuth, taskController.updateStatus);
// Маршруты задач (Защищены middleware requireAuth)
app.post('/api/tasks', requireAuth, taskController.create);             // Сreate (Появился)
app.get('/api/tasks', requireAuth, taskController.getAll);             // Read (Был)
app.get('/api/tasks/:id', requireAuth, taskController.getById);         // Read by ID (Появился)
app.put('/api/tasks/:id/status', requireAuth, taskController.updateStatus); // Update status (Был)
app.delete('/api/tasks/:id', requireAuth, taskController.deleteTask);    // Delete (Появился)

app.listen(PORT, () => {
    console.log(`=== [Server] Трекер задач успешно запущен на порту ${PORT} ===`);
});