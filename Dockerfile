FROM node:20-alpine
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем ВСЕ зависимости (включая tsx и typescript)
RUN npm install

# Копируем весь исходный код проекта
COPY . .

EXPOSE 8000

# Запускаем приложение напрямую через tsx
CMD ["npm", "run", "start"]