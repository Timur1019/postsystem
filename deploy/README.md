# Деплой Aurent POS на Ubuntu-сервер

Схема:

```
[Ubuntu + Docker]
  ├── frontend :80   — веб-админка (менеджер/админ)
  ├── backend  :8080 — API (касса Aurent Cashier + health)
  └── postgres       — только внутри Docker
```

## 1. Подготовка сервера (один раз)

На сервере (SSH, root):

```bash
apt update && apt upgrade -y
```

Скопируйте проект на сервер или клонируйте репозиторий в `/opt/aurent-pos`, затем:

```bash
cd /opt/aurent-pos
sudo bash deploy/ubuntu-prepare.sh
```

Скрипт установит Docker, Compose, UFW (порты **22**, **80**, **8080**).

## 2. Настройка секретов

```bash
cd /opt/aurent-pos
cp .env.example .env
nano .env
```

Обязательно измените:

- `POSTGRES_PASSWORD`
- `JWT_SECRET` (не короче 32 символов)

## 3. Проверка перед деплоем

```bash
cp .env.example .env && nano .env
bash deploy/prod-check.sh
```

## 4. Запуск

```bash
bash deploy/deploy.sh
```

Проверка:

```bash
curl -s http://localhost/api/v1/actuator/health
curl -s http://localhost:8080/api/v1/actuator/health
```

В браузере: `http://IP_СЕРВЕРА/` — вход `admin` / `password` (смените после первого входа).

## 5. Копирование с Mac (разработка)

```bash
chmod +x deploy/sync-to-server.sh deploy/deploy.sh deploy/ubuntu-prepare.sh
./deploy/sync-to-server.sh root@ВАШ_IP
```

Затем на сервере: `nano .env` → `bash deploy/deploy.sh`.

## 6. Касса (Aurent Cashier)

На ПК кассира в настройках приложения:

- **IP сервера** — адрес Ubuntu
- **Порт** — `8080`
- Проверка: `http://IP:8080/api/v1/actuator/health`

## 7. Полезные команды

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml down
```

Обновление версии:

```bash
git pull   # или повторный rsync
bash deploy/deploy.sh
```

## 8. SSL (по желанию)

См. `deploy/nginx-host.conf.example` и Certbot для домена.

## Порты

| Порт | Назначение        |
|------|-------------------|
| 22   | SSH               |
| 80   | Веб-интерфейс     |
| 8080 | API для кассы     |
| 5432 | Postgres (не наружу) |
