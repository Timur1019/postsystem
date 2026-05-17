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

Собирается **только на Windows**:

```bash
SERVER_HOST=111.88.132.126 ./scripts/build-cashier.sh
```

Скопировать `desktop-cashier/release/*Setup*.exe` в `dist/.../windows/`.

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
