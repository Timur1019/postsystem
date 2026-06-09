# Деплой Aurent POS на Ubuntu-сервер

## Архитектура (senior-level для текущего масштаба)

```
git pull → deploy.sh
    ├── postgres (volume, healthcheck)
    ├── backend  (Liquibase → JPA validate → API)
    └── frontend (nginx, /api → backend)
```

| Компонент | Оценка | Комментарий |
|-----------|--------|-------------|
| Docker Compose prod | ✅ | healthcheck, depends_on, secrets из `.env` |
| Скрипты deploy | ✅ | `set -euo pipefail`, проверка JWT/паролей, ожидание health |
| Миграции БД | ✅ | один путь: Liquibase (после PR-5) |
| CI/CD backend | ✅ | `deploy-web.yml` + desktop workflow |
| Бэкапы Postgres | ✅ | `backup-db.sh` + cron |
| SSL / reverse proxy | ⚠️ | пример nginx есть, не в compose |
| K8s | — | не нужен на этом этапе |

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
- `AI_ASSISTANT_API_KEY` — ключ [DeepSeek](https://platform.deepseek.com/) (иначе ассистент без живого чата)

## 3. Проверка перед деплоем

```bash
cp .env.example .env && nano .env
bash deploy/prod-check.sh
```

## 4. Запуск

```bash
bash deploy/deploy.sh
```

Скрипт поднимает Postgres → backend (Liquibase) → frontend.

**Один источник правды для схемы БД:** Liquibase `web-backend/src/main/resources/db/changelog/`.

| Этап | Кто |
|------|-----|
| Пустая БД | backend: `v1-baseline` (schema.sql) + `v2-incremental` |
| Уже работающий prod | Liquibase видит `app_schema_migrations` → пропускает применённые |
| Hotfix без рестарта backend | `bash deploy/migrate-db.sh` (legacy fallback) |

Новая миграция: SQL в `db/` + changeset в `v2-incremental.xml`.

Legacy migrate-db (опционально):

```bash
bash deploy/migrate-db.sh
# или вместе с deploy:
RUN_LEGACY_MIGRATE=1 bash deploy/deploy.sh
```

Проверка:

```bash
curl -s http://localhost/api/v1/actuator/health
curl -s http://localhost:8080/api/v1/actuator/health
```

В браузере: `http://IP_СЕРВЕРА/` — вход `admin` / `password` (смените после первого входа).

## 5. Деплой через Git (рекомендуется)

`.env` на сервере **не в Git** — при `git pull` не перезаписывается.

**Один раз** (если уже есть папка после rsync):

```bash
cd /opt/aurent-pos
bash deploy/git-bootstrap.sh
```

Или чистый клон:

```bash
git clone https://github.com/Timur1019/postsystem.git /opt/aurent-pos
cd /opt/aurent-pos
bash deploy/ubuntu-prepare.sh
bash deploy/setup-env.sh
bash deploy/deploy.sh
```

**Каждое обновление** после merge в `main`:

```bash
cd /opt/aurent-pos
bash deploy/git-update.sh   # git pull + migrate-db + docker rebuild
```

На Mac: ветка → PR → merge → `git push`. На сервере — только `git-update.sh`.

Приватный репозиторий: на сервере SSH-ключ для GitHub, затем `git clone git@github.com:USER/postsystem.git /opt/aurent-pos`.

## 6. Rsync (запасной вариант)

```bash
chmod +x deploy/sync-to-server.sh
./deploy/sync-to-server.sh root@ВАШ_IP
```

Затем на сервере: `bash deploy/deploy.sh`.

## 7. Касса (Aurent Cashier)

Десктоп-касса — **тонкий клиент**: интерфейс грузится с сервера (`http://IP/`), API через nginx на том же порту (`/api`).

На ПК кассира в мастере настройки:

- **IP сервера** — адрес Ubuntu
- **Порт веб-интерфейса** — `80`
- **Порт API** — `8080` (резерв; в проде health удобнее через nginx)

Проверка с ПК кассира:

```bash
curl -s http://IP/api/v1/actuator/health
curl -s -o /dev/null -w "%{http_code}" http://IP/login
```

**Обновление UI на всех кассах** без переустановки `.exe`/`.dmg`:

```bash
bash deploy/git-update.sh
```

На кассе: «Вид → Обновить» или перезапуск приложения.

На файрволе кассовой сети должен быть доступен **порт 80** до сервера (не только 8080).

## 7.1. Страница загрузки кассы (`/install`)

Публичная страница без авторизации:

```
https://ВАШ_ДОМЕН/install
```

Карточки партнёров (Aurent, DT Group, Pomot) — **один и тот же установщик**, сервер кассир указывает в мастере первого запуска.

Файлы лежат на сервере:

```
/opt/aurent-pos/downloads/desktop/
  manifest.json
  latest.yml / latest-mac.yml
  Aurent-Cashier-Setup-*-x64.exe
  Aurent-Cashier-*.dmg
```

nginx отдаёт их по URL `/downloads/desktop/...` (volume в `docker-compose.prod.yml`).

### Сборка desktop (CI, без Mac/Windows на вашем ПК)

При изменении `desktop-cashier/` GitHub Actions собирает `.dmg` + `.exe` и заливает на сервер.

Secrets в GitHub:

| Secret | Назначение |
|--------|------------|
| `DEPLOY_SSH_KEY` | SSH-ключ для сервера |
| `DEPLOY_HOST` | IP или домен сервера |
| `DEPLOY_USER` | SSH-пользователь (по умолчанию `root`) |
| `SERVER_HOST` | IP для мастера настройки в установщике |

Ручной запуск: GitHub → Actions → **Build Desktop Cashier** → Run workflow.

Локально (одна платформа):

```bash
chmod +x scripts/build-desktop-release.sh scripts/generate-desktop-manifest.sh
PLATFORM=mac COPY_TO_DOWNLOADS=1 ./scripts/build-desktop-release.sh
```

### Два уровня обновлений

| Что | Как |
|-----|-----|
| **UI кассы** (React) | `bash deploy/git-update.sh` → на кассе «Вид → Обновить» |
| **Electron-оболочка** | CI → `/downloads/desktop/` → auto-update в приложении |

## 8. Бэкапы PostgreSQL

Ручной дамп:

```bash
bash deploy/backup-db.sh
# → backups/postgres/pos_db_YYYYMMDD_HHMMSS.sql.gz
```

Ежедневно в 03:00 (cron на сервере):

```bash
bash deploy/install-backup-cron.sh
```

Восстановление (осторожно — перезаписывает БД):

```bash
bash deploy/restore-db.sh backups/postgres/pos_db_20260610_030001.sql.gz
```

Переменные: `BACKUP_DIR`, `RETENTION_DAYS` (по умолчанию 14).

## 9. CI/CD — автодеплой web (GitHub Actions)

Workflow **Deploy Web Stack** (`.github/workflows/deploy-web.yml`):

- триггер: push в `main` при изменении `web-backend/`, `web-frontend/`, `deploy/`
- шаги: бэкап БД → `git-update.sh` на сервере → health check

Secrets (те же, что для desktop):

| Secret | Назначение |
|--------|------------|
| `DEPLOY_SSH_KEY` или `DEPLOY_SSH_KEY_B64` | приватный SSH-ключ |
| `DEPLOY_HOST` | IP/домен сервера |
| `DEPLOY_USER` | SSH-пользователь (по умолчанию `root`) |

Ручной запуск: GitHub → Actions → **Deploy Web Stack** → Run workflow.

## 10. Полезные команды

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml down
```

Обновление версии:

```bash
bash deploy/git-update.sh
```

## 11. Подключение к БД (DataGrip / DBeaver)

На сервере Postgres слушает только внутри Docker. С Mac — SSH-туннель:

```bash
ssh -L 5433:127.0.0.1:5432 user@IP_СЕРВЕРА
```

В IDE: Host `localhost`, Port `5433`, Database `pos_db`, User `pos_user`, пароль из `.env` (`POSTGRES_PASSWORD`).

На сервере напрямую:

```bash
docker compose -f docker-compose.prod.yml exec -it postgres psql -U pos_user -d pos_db
```

## 12. SSL (по желанию)

См. `deploy/nginx-host.conf.example` и Certbot для домена.

## Порты

| Порт | Назначение        |
|------|-------------------|
| 22   | SSH               |
| 80   | Веб-интерфейс     |
| 8080 | API для кассы     |
| 5432 | Postgres (не наружу) |
