// src/repositories/TaskRepository.ts

import { pool } from '../infrastructure/database.js';
import { Task, SimpleTask, ComplexTask, TaskStatus, SubTask } from '../domain/Task.js';

export class TaskRepository {

    // Получение всех задач конкретного пользователя
    public async findByUserId(userId: number): Promise<Task[]> {
        const query = `
            SELECT 
                t.id, t.title, t.description, t.status, t.type, t.user_id, t.created_at,
                st.id as sub_id, st.title as sub_title, st.is_completed as sub_completed
            FROM tasks t
            LEFT JOIN subtasks st ON t.id = st.task_id
            WHERE t.user_id = $1
            ORDER BY t.created_at DESC;
        `;

        const { rows } = await pool.query(query, [userId]);

        const taskMap = new Map<number, any>();

        for (const row of rows) {
            if (!taskMap.has(row.id)) {
                taskMap.set(row.id, {
                    id: row.id,
                    title: row.title,
                    description: row.description,
                    status: row.status as TaskStatus,
                    type: row.type,
                    userId: row.user_id,
                    createdAt: row.created_at,
                    subtasks: []
                });
            }

            if (row.sub_id) {
                taskMap.get(row.id).subtasks.push({
                    id: row.sub_id,
                    title: row.sub_title,
                    isCompleted: row.sub_completed
                });
            }
        }

        return Array.from(taskMap.values()).map(t => {
            if (t.type === 'COMPLEX') {
                return new ComplexTask(t.id, t.title, t.description, t.status, t.userId, t.createdAt, t.subtasks);
            }
            return new SimpleTask(t.id, t.title, t.description, t.status, t.userId, t.createdAt);
        });
    }

    // Обновление статуса задачи с валидацией бизнес-логики перед записью
    public async updateStatus(id: number, status: TaskStatus): Promise<boolean> {
        const checkQuery = `
            SELECT t.*, st.id as sub_id, st.title as sub_title, st.is_completed as sub_completed
            FROM tasks t 
            LEFT JOIN subtasks st ON t.id = st.task_id 
            WHERE t.id = $1
        `;
        const { rows } = await pool.query(checkQuery, [id]);
        if (rows.length === 0) return false;

        const firstRow = rows[0];
        let task: Task;

        if (firstRow.type === 'COMPLEX') {
            const subtasks: SubTask[] = rows
                .filter(r => r.sub_id)
                .map(r => ({ id: r.sub_id, title: r.sub_title, isCompleted: r.sub_completed }));
            task = new ComplexTask(firstRow.id, firstRow.title, firstRow.description, firstRow.status, firstRow.user_id, firstRow.created_at, subtasks);
        } else {
            task = new SimpleTask(firstRow.id, firstRow.title, firstRow.description, firstRow.status, firstRow.user_id, firstRow.created_at);
        }

        if (status === 'DONE' && !task.canBeClosed()) {
            throw new Error('Невозможно закрыть комплексную задачу: не все подзадачи выполнены.');
        }

        const updateQuery = 'UPDATE tasks SET status = $1 WHERE id = $2';
        await pool.query(updateQuery, [status, id]);
        return true;
    }

    public async create(userId: number, title: string, description: string, type: 'SIMPLE' | 'COMPLEX'): Promise<Task> {
        const query = `
            INSERT INTO tasks (title, description, status, type, user_id)
            VALUES ($1, $2, 'OPEN', $3, $4)
            RETURNING id, title, description, status, type, user_id, created_at;
        `;
        const { rows } = await pool.query(query, [title, description, type, userId]);
        const row = rows[0];

        if (row.type === 'COMPLEX') {
            return new ComplexTask(row.id, row.title, row.description, row.status as TaskStatus, row.user_id, row.created_at, []);
        }
        return new SimpleTask(row.id, row.title, row.description, row.status as TaskStatus, row.user_id, row.created_at);
    }

    // Получение одной конкретной задачи по ID
    public async findById(id: number): Promise<Task | null> {
        const query = `
            SELECT 
                t.id, t.title, t.description, t.status, t.type, t.user_id, t.created_at,
                st.id as sub_id, st.title as sub_title, st.is_completed as sub_completed
            FROM tasks t
            LEFT JOIN subtasks st ON t.id = st.task_id
            WHERE t.id = $1;
        `;
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) return null;

        const firstRow = rows[0];
        if (firstRow.type === 'COMPLEX') {
            const subtasks: SubTask[] = rows
                .filter(r => r.sub_id)
                .map(r => ({ id: r.sub_id, title: r.sub_title, isCompleted: r.sub_completed }));
            return new ComplexTask(firstRow.id, firstRow.title, firstRow.description, firstRow.status as TaskStatus, firstRow.user_id, firstRow.created_at, subtasks);
        }
        return new SimpleTask(firstRow.id, firstRow.title, firstRow.description, firstRow.status as TaskStatus, firstRow.user_id, firstRow.created_at);
    }

    // Удаление задачи по ID (DELETE)
    public async delete(id: number): Promise<boolean> {
        // Сначала удаляем связанные подзадачи из-за внешнего ключа (если в БД не настроен ON DELETE CASCADE)
        await pool.query('DELETE FROM subtasks WHERE task_id = $1', [id]);
        const query = 'DELETE FROM tasks WHERE id = $1';
        const { rowCount } = await pool.query(query, [id]);
        return (rowCount ?? 0) > 0;
    }
}