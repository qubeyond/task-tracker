FROM node:18-alpine

WORKDIR /app

# Сначала копируем файлы зависимостей (для кэширования слоев Docker)
COPY package*.json ./

# Устанавливаем все зависимости (включая dev-зависимости для TypeScript)
RUN npm install

# Копируем остальной код проекта
COPY . .

# Открываем порт наружу
EXPOSE 8000

# Запускаем приложение в режиме разработки через ts-node
CMD ["npx", "ts-node", "src/app.ts"]