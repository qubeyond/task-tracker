// src/domain/Task.ts

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE';

// Абстрактный класс — фундамент для всех типов задач
export abstract class Task {
    public readonly id: number;
    public title: string;
    public description: string;
    public status: TaskStatus;
    public readonly userId: number;
    public readonly createdAt: Date;

    constructor(id: number, title: string, description: string, status: TaskStatus, userId: number, createdAt: Date) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.status = status;
        this.userId = userId;
        this.createdAt = createdAt;
    }

    // Абстрактный метод (контракт полиморфизма)
    // Диктует правила: может ли задача быть переведена в статус DONE
    public abstract canBeClosed(): boolean;
}

// 1. Модель простой задачи
export class SimpleTask extends Task {
    // У простой задачи нет блокирующих факторов для закрытия
    public override canBeClosed(): boolean {
        return true;
    }
}

// Интерфейс для подзадач, хранящихся внутри комплексной задачи
export interface SubTask {
    id: number;
    title: string;
    isCompleted: boolean;
}

// 2. Модель комплексной (составной) задачи
export class ComplexTask extends Task {
    public subtasks: SubTask[];

    constructor(id: number, title: string, description: string, status: TaskStatus, userId: number, createdAt: Date, subtasks: SubTask[] = []) {
        super(id, title, description, status, userId, createdAt);
        this.subtasks = subtasks;
    }

    // Полиморфная реализация бизнес-правила:
    // Комплексную задачу нельзя закрыть, пока не выполнены ВСЕ её подзадачи
    public override canBeClosed(): boolean {
        if (this.subtasks.length === 0) {
            return true;
        }
        return this.subtasks.every(subtask => subtask.isCompleted);
    }
}