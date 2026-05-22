# Aurent Cashier (Desktop)

Приложение-касса (Electron). **Интерфейс загружается с сервера** (`http://IP:80/`) — тот же фронт, что в Docker. API идёт через nginx (`/api` на том же порту).

После `bash deploy/git-update.sh` на сервере кассирам достаточно **«Вид → Обновить»** (или перезапустить приложение). Переустановка `.dmg`/`.exe` не нужна, пока не меняется сама оболочка Electron.

## Сборка установщика

```bash
cd /Users/timur/Desktop/postsystem
chmod +x scripts/build-cashier.sh
./scripts/build-cashier.sh
```

Другой сервер:

```bash
SERVER_HOST=111.88.132.126 SERVER_WEB_PORT=80 ./scripts/build-cashier.sh
```

Встроенный UI в установщик (только dev/офлайн):

```bash
INCLUDE_WEB_DIST=1 ./scripts/build-cashier.sh
```

Результат: `dist/Aurent-Cashier-Desktop-1.0.0.zip`.

## Windows .exe

Собирается **только на ПК с Windows 10/11** (64-bit).

По умолчанию в установщик **вкладывается актуальный фронт** (`INCLUDE_WEB_DIST=1`): интерфейс из программы, API — на сервер из мастера настройки.

```cmd
cd C:\Users\user\postsystem
scripts\build-cashier-windows.bat
```

Тонкий клиент (UI только с сервера, без встройки фронта):

```cmd
set INCLUDE_WEB_DIST=0
scripts\build-cashier-windows.bat
```

Файл: `desktop-cashier\release\Aurent-Cashier-Setup-1.0.0-x64.exe`  
или portable: `dist\Aurent-Cashier-Windows-portable.zip`

| ОС | Поддержка |
|----|-----------|
| Windows 11 x64 | Да |
| Windows 10 x64 | Да |
| Windows 7 / 8 | **Нет** — касса в браузере: `http://IP_СЕРВЕРА/` |

## Разработка (встроенный web-dist)

```bash
cd web-frontend && npm run build && cp -R dist ../desktop-cashier/web-dist
cd ../desktop-cashier
npm install
POS_EMBEDDED=1 npm run dev
```

Без `POS_EMBEDDED=1` приложение ожидает удалённый сервер (как в проде).

## Настройка на кассе

При первом запуске: домен сервера (например `www.aurent.uz`), порт сайта и API (**443** для HTTPS, **80** для HTTP).

Проверка с ПК кассира:

- `https://www.aurent.uz/api/v1/actuator/health`
- `https://www.aurent.uz/login`

Порты сайта и API должны совпадать (оба **443** через nginx). Порт **8080** с интернета обычно не нужен.

## Сервер

На файрволе сервера должен быть открыт **порт 80** (не только 8080). См. `deploy/README.md`.
