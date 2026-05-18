# Aurent Cashier (Desktop)

Приложение кассира. Подключается к API на сервере (`:8080`), интерфейс встроен в установщик.

## Сборка установщика (на Mac разработчика)

```bash
cd /Users/timur/Desktop/postsystem
chmod +x scripts/build-cashier.sh
./scripts/build-cashier.sh
```

Другой сервер:

```bash
SERVER_HOST=111.88.132.126 SERVER_PORT=8080 ./scripts/build-cashier.sh
```

Результат: `dist/Aurent-Cashier-Desktop-1.0.0.zip` — раздать кассирам.

## Windows .exe

Собирается **только на ПК с Windows 10/11** (64-bit).

**Проще всего** — двойной щелчок или в cmd:

```cmd
cd C:\Users\user\postsystem
scripts\build-cashier-windows.bat
```

Если ошибка `Cannot create symbolic link` при сборке:

1. **Параметры Windows** → Конфиденциальность → **Для разработчиков** → включить **Режим разработчика**
2. Или запустить **cmd от имени администратора**
3. Перед сборкой:

```cmd
set CSC_IDENTITY_AUTO_DISCOVERY=false
rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign"
cd desktop-cashier
npm run dist:win
```

Файл: `release/Aurent-Cashier-Setup-1.0.0-x64.exe`

### Совместимость ОС

| ОС | Поддержка |
|----|-----------|
| Windows 11 x64 | Да |
| Windows 10 x64 | Да |
| Windows 7 / 8 | **Нет** (Electron 28 требует Win10+) |

На Windows 7 — касса через браузер: `http://IP_СЕРВЕРА/`

## Разработка

```bash
cd desktop-cashier
npm install
# сначала web-dist:
cd ../web-frontend && npm run build && cp -R dist ../desktop-cashier/web-dist
cd ../desktop-cashier
POS_EMBEDDED=1 npm start
```

## Сервер

- Health: `http://111.88.132.126:8080/api/v1/actuator/health`
- Веб-админка: `http://111.88.132.126/`
