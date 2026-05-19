-- 1. Таблица пользователей для регистрации и сессий
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Базовая таблица задач (содержит общие для всех типов поля)
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    project VARCHAR(255) NOT NULL,
    task_type VARCHAR(20) NOT NULL, -- Дискриминатор: 'bug', 'feature', 'doc'
    priority VARCHAR(20) NOT NULL,   -- низкий, средний, высокий, критический
    status VARCHAR(20) NOT NULL DEFAULT 'открыта', -- в работе, на проверке, закрыта
    assignee VARCHAR(255) DEFAULT 'не назначен',
    created_at DATE NOT NULL DEFAULT CURRENT_DATE,
    deadline DATE NOT NULL,
    closed_at DATE,                 -- Заполняется при переводе в статус 'закрыта'
    creator_id INT REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Таблица-наследник для Багов (BugTask)
CREATE TABLE bug_tasks (
    task_id INT PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
    severity VARCHAR(20) NOT NULL, -- блокирующая, критическая, минорная
    system_module VARCHAR(100) NOT NULL,
    target_version VARCHAR(50) NOT NULL
);

-- 4. Таблица-наследник для Фич (FeatureTask)
CREATE TABLE feature_tasks (
    task_id INT PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
    functional_block VARCHAR(100) NOT NULL,
    estimation_hours INT NOT NULL,
    customer_priority INT NOT NULL
);

-- 5. Таблица-наследник для Документации (DocTask)
CREATE TABLE doc_tasks (
    task_id INT PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
    doc_type VARCHAR(100) NOT NULL, -- спецификация, руководство, API
    target_audience VARCHAR(100) NOT NULL,
    completion_percentage INT NOT NULL CHECK (completion_percentage BETWEEN 0 AND 100)
);

-- 6. БЕЗОПАСНОСТЬ: Создание изолированного пользователя приложения
-- Приложение будет ходить в базу НЕ под рутом (postgres_admin), а под юзером с ограниченными правами
CREATE USER task_app_user WITH PASSWORD 'app_secure_password_2026';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO task_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO task_app_user;