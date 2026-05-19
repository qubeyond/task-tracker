// src/services/TaskService.ts

import { TaskRepository } from '../repositories/TaskRepository.js';
import { Task, SubTask, TaskStatus } from '../domain/Task.js'; // Добавлен импорт TaskStatus

export class TaskService {
    private taskRepository = new TaskRepository();

    // Получение списка задач для конкретного пользователя
    public async getUserTasks(userId: number): Promise<Task[]> {
        return this.taskRepository.findByUserId(userId);
    }

    // Изменение статуса задачи с валидацией бизнес-правил полиморфизма
    public async updateTaskStatus(taskId: number, status: TaskStatus): Promise<boolean> {
        // Логика проверки возможности закрытия инкапсулирована внутри метода репозитория,
        // который воссоздает доменный объект (SimpleTask или ComplexTask)
        return this.taskRepository.updateStatus(taskId, status);
    }

    public async createTask(userId: number, title: string, description: string, type: 'SIMPLE' | 'COMPLEX'): Promise<Task> {
        return this.taskRepository.create(userId, title, description, type);
    }

    public async getTaskById(taskId: number): Promise<Task | null> {
        return this.taskRepository.findById(taskId);
    }

    public async deleteTask(taskId: number): Promise<boolean> {
        return this.taskRepository.delete(taskId);
    }

    public async addSubtask(taskId: number, title: string): Promise<SubTask> {
        return this.taskRepository.createSubtask(taskId, title);
    }

    public async toggleSubtask(subtaskId: number, isCompleted: boolean): Promise<boolean> {
        return this.taskRepository.updateSubtaskStatus(subtaskId, isCompleted);
    }
}