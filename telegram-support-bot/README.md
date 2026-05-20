# Telegram-бот поддержки Aurent POS

Бот принимает обращения от пользователей в личных сообщениях и пересылает их в группу поддержки.

## Настройка

1. Создайте бота через [@BotFather](https://t.me/BotFather), получите токен.
2. Создайте группу в Telegram, добавьте бота в группу **как администратора** (чтобы мог писать).
3. Узнайте `chat.id` группы:
   - Напишите любое сообщение в группу.
   - Откройте в браузере: `https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates`
   - Найдите `"chat":{"id":-100...}` — это `TELEGRAM_SUPPORT_GROUP_ID`.
4. Скопируйте `.env.example` в `.env` и заполните переменные.

## Запуск

### Production (сервер, Docker — рекомендуется)

В корневом `.env` на сервере:

```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_SUPPORT_GROUP_ID=-100...
VITE_SUPPORT_TELEGRAM_BOT=your_bot_username
```

```bash
cd /opt/aurent-pos
bash deploy/deploy.sh
# или только бот:
docker compose -f docker-compose.prod.yml up -d --build telegram-support-bot
docker compose -f docker-compose.prod.yml logs -f telegram-support-bot
```

Бот работает 24/7 в контейнере, **npm на сервере не нужен**.

### Локально (разработка)

```bash
cd telegram-support-bot
npm install
npm start
```

Для разработки с автоперезагрузкой: `npm run dev`.

## Поведение

- `/start` — приветствие и просьба описать проблему.
- Текст, фото или документ — пересылка в группу + подтверждение пользователю.

## Связь с веб-приложением

В сборке фронтенда задайте:

- `VITE_SUPPORT_PHONE` — телефон на странице «Поддержка»
- `VITE_SUPPORT_TELEGRAM_BOT` — username бота без `@` (ссылка `https://t.me/<bot>`)

Страница доступна в админке (`/support`) и в кассе (`/cashier/support`).
