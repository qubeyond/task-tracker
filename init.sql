-- init.sql

-- 1. Таблица пользователей для регистрации и сессий
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Базовая таблица задач с дискриминатором типа (SIMPLE / COMPLEX)
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'IN_PROGRESS', 'DONE'
    type VARCHAR(20) NOT NULL DEFAULT 'SIMPLE', -- 'SIMPLE', 'COMPLEX'
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Таблица подзадач для комплексных задач (Связь один-ко-многим)
CREATE TABLE subtasks (
    id SERIAL PRIMARY KEY,
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE
);

-- 4. БЕЗОПАСНОСТЬ: Создание изолированного пользователя приложения
-- Проверяем, существует ли пользователь, чтобы избежать ошибок при перезапуске
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'task_app_user') THEN
        CREATE USER task_app_user WITH PASSWORD 'app_secure_password_2026';
    END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO task_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO task_app_user;