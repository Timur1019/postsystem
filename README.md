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

**Деплой через Git** (после merge в `main`):

```bash
# на сервере
cd /opt/aurent-pos
bash deploy/git-update.sh
```

Первый раз на сервере:

```bash
bash deploy/git-bootstrap.sh   # или git clone + ubuntu-prepare
bash deploy/setup-env.sh
bash deploy/deploy.sh
```

Подробнее: [deploy/README.md](deploy/README.md)

| Порт | Назначение |
|------|------------|
| 80 | Веб-интерфейс |
| 8080 | API (касса + health) |

## Касса

Страница загрузки: **`/install`** (публичная, без входа).

В настройках Aurent Cashier укажите IP сервера и порт **80** (или **443** для HTTPS).

Проверка: `http://<server>/api/v1/actuator/health`

## Секреты

Не коммитьте `.env`. Шаблон: `.env.example`.
