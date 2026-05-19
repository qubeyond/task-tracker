// src/controllers/TaskController.ts

import { Request, Response } from 'express';
import { TaskService } from '../services/TaskService.js';
import { TaskStatus } from '../domain/Task.js';

export class TaskController {
    private taskService = new TaskService();

    public getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            // userId гарантированно есть благодаря middleware requireAuth
            const userId = req.session.userId!;
            const tasks = await this.taskService.getUserTasks(userId);

            res.status(200).json({
                status: 'success',
                data: tasks
            });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    };

    public updateStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!id || !status) {
                res.status(400).json({ status: 'error', message: 'Отсутствует ID задачи или целевой статус.' });
                return;
            }

            // Явно приводим к строке, гарантируя TypeScript, что значение существует
            const taskId = parseInt(id as string, 10);

            if (isNaN(taskId)) {
                res.status(400).json({ status: 'error', message: 'Неверный формат ID задачи.' });
                return;
            }

            const success = await this.taskService.updateTaskStatus(taskId, status as TaskStatus);

            if (!success) {
                res.status(404).json({ status: 'error', message: 'Задача не найдена.' });
                return;
            }

            res.status(200).json({
                status: 'success',
                message: 'Статус задачи успешно обновлен.'
            });
        } catch (error: any) {
            res.status(400).json({ status: 'error', message: error.message });
        }
    };

    public create = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.session.userId!;
            const { title, description, type } = req.body;

            if (!title) {
                res.status(400).json({ status: 'error', message: 'Название задачи обязательно.' });
                return;
            }

            // По умолчанию создаем простую задачу, если тип не указан явно
            const taskType = type === 'COMPLEX' ? 'COMPLEX' : 'SIMPLE';

            const newTask = await this.taskService.createTask(userId, title, description || '', taskType);
            res.status(201).json({
                status: 'success',
                data: newTask
            });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    };

    public getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ status: 'error', message: 'Идентификатор задачи не указан.' });
                return;
            }

            // Приведение к типу string устраняет ошибку компиляции "string | string[] | undefined"
            const taskId = parseInt(id as string, 10);

            if (isNaN(taskId)) {
                res.status(400).json({ status: 'error', message: 'Неверный формат ID задачи.' });
                return;
            }

            const task = await this.taskService.getTaskById(taskId);
            if (!task) {
                res.status(404).json({ status: 'error', message: 'Задача не найдена.' });
                return;
            }

            res.status(200).json({ status: 'success', data: task });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    };

    public deleteTask = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ status: 'error', message: 'Идентификатор задачи не указан.' });
                return;
            }

            // Приведение к типу string для безопасного парсинга числового ID
            const taskId = parseInt(id as string, 10);

            if (isNaN(taskId)) {
                res.status(400).json({ status: 'error', message: 'Неверный формат ID задачи.' });
                return;
            }

            const success = await this.taskService.deleteTask(taskId);
            if (!success) {
                res.status(404).json({ status: 'error', message: 'Задача не найдена для удаления.' });
                return;
            }

            res.status(200).json({ status: 'success', message: 'Задача успешно удалена.' });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    };

    public addSubtask = async (req: Request, res: Response): Promise<void> => {
        try {
            const { taskId } = req.params;
            const { title } = req.body;

            if (!taskId || !title) {
                res.status(400).json({ status: 'error', message: 'ID задачи и название подзадачи обязательны.' });
                return;
            }

            // Явное приведение к string для удовлетворения компилятора (Строка 150)
            const parentTaskId = parseInt(taskId as string, 10);
            if (isNaN(parentTaskId)) {
                res.status(400).json({ status: 'error', message: 'Неверный формат ID родительской задачи.' });
                return;
            }

            const subtask = await this.taskService.addSubtask(parentTaskId, title);
            res.status(201).json({
                status: 'success',
                data: subtask
            });
        } catch (error: any) {
            res.status(400).json({ status: 'error', message: error.message });
        }
    };

    public toggleSubtask = async (req: Request, res: Response): Promise<void> => {
        try {
            const { subtaskId } = req.params;
            const { isCompleted } = req.body;

            if (isCompleted === undefined) {
                res.status(400).json({ status: 'error', message: 'Статус выполнения (isCompleted) обязателен.' });
                return;
            }

            if (!subtaskId) {
                res.status(400).json({ status: 'error', message: 'Идентификатор подзадачи не указан.' });
                return;
            }

            // Явное приведение к string для безопасного парсинга (Строка 176)
            const id = parseInt(subtaskId as string, 10);
            if (isNaN(id)) {
                res.status(400).json({ status: 'error', message: 'Неверный формат ID подзадачи.' });
                return;
            }

            const success = await this.taskService.toggleSubtask(id, !!isCompleted);
            if (!success) {
                res.status(404).json({ status: 'error', message: 'Подзадача не найдена.' });
                return;
            }

            res.status(200).json({
                status: 'success',
                message: 'Статус подзадачи успешно изменен.'
            });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    };
}