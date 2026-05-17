# Aurent POS (postsystem)

Монолитная POS-система: веб-админка, API для кассы, PostgreSQL.

## Стек

| Часть | Технологии |
|-------|------------|
| Backend | Java 17, Spring Boot 3, PostgreSQL |
| Frontend | Vue 3, Vite, Bootstrap |
| Касса | Electron (`desktop-cashier/`) |
| Деплой | Docker Compose |

## Структура

```
postsystem/
├── web-backend/      # REST API
├── web-frontend/     # Веб-интерфейс (менеджер/админ)
├── desktop-cashier/  # Aurent Cashier (Electron)
├── deploy/           # Скрипты деплоя на Ubuntu
├── docker-compose.yml
└── docker-compose.prod.yml
```

## Локальная разработка

```bash
# БД + API + фронт
docker compose up -d --build

# Или по отдельности:
cd web-backend && mvn spring-boot:run
cd web-frontend && npm install && npm run dev
```

API: `http://localhost:8080/api/v1`  
Веб: `http://localhost:5173` (Docker: порт 5173 → nginx 80)

Демо-логин после init БД: `admin` / `password`

## Production (Ubuntu + Docker)

```bash
cp .env.example .env
nano .env                    # POSTGRES_PASSWORD, JWT_SECRET (≥32 символов)
bash deploy/prod-check.sh
bash deploy/deploy.sh
```

Подробнее: [deploy/README.md](deploy/README.md)

| Порт | Назначение |
|------|------------|
| 80 | Веб-интерфейс |
| 8080 | API (касса + health) |

## Касса

В настройках Aurent Cashier укажите IP сервера и порт **8080**.

Проверка: `http://<server>:8080/api/v1/actuator/health`

## Секреты

Не коммитьте `.env`. Шаблон: `.env.example`.
