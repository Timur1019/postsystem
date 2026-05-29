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

Скрипт сам поднимает Postgres, применяет **новые** миграции из списка `deploy/migrations-prod.txt` (учёт в `app_schema_migrations`), затем запускает backend и frontend. Ручной `psql` для этих миграций не нужен.

Новую миграцию добавьте в `web-backend/src/main/resources/db/` и пропишите имя файла в `deploy/migrations-prod.txt`.

Только миграции (БД уже запущена):

```bash
bash deploy/migrate-db.sh
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

## 8. Полезные команды

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

## 9. Подключение к БД (DataGrip / DBeaver)

На сервере Postgres слушает только внутри Docker. С Mac — SSH-туннель:

```bash
ssh -L 5433:127.0.0.1:5432 user@IP_СЕРВЕРА
```

В IDE: Host `localhost`, Port `5433`, Database `pos_db`, User `pos_user`, пароль из `.env` (`POSTGRES_PASSWORD`).

На сервере напрямую:

```bash
docker compose -f docker-compose.prod.yml exec -it postgres psql -U pos_user -d pos_db
```

## 10. SSL (по желанию)

См. `deploy/nginx-host.conf.example` и Certbot для домена.

## Порты

| Порт | Назначение        |
|------|-------------------|
| 22   | SSH               |
| 80   | Веб-интерфейс     |
| 8080 | API для кассы     |
| 5432 | Postgres (не наружу) |
