# Весы (Electron)

Отдельный модуль для USB/RS-232 весов в десктоп-кассе.

## Файлы

| Файл | Назначение |
|------|------------|
| `scale-parser.cjs` | Разбор строк с весов → кг |
| `scale-serial-port.cjs` | Обёртка над `serialport` (опционально) |
| `scale-mock.cjs` | Эмуляция для разработки |
| `scale-config.cjs` | `config.json`: порт, скорость |
| `scale-manager.cjs` | Сессия, события в UI |
| `scale-auto-detect.cjs` | Поиск COM и проверка ответа весов |
| `scale-picker-window.cjs` | Окно настройки (как принтер) |
| `index.cjs` | IPC для `preload.cjs` |

## Автонастройка

1. Установите драйвер весов в Windows → появится **COM-порт** (например `COM3`).
2. В кассе: меню **Aurent → «Весы»** → **«Найти автоматически»** (или выбор порта вручную).
3. Порт сохраняется в `config.json` — при следующем открытии модалки веса подключение **само**.

Если порт не сохранён, при первом открытии вкладки «Весы» в модалке приложение **само перебирает COM-порты** и запоминает найденный.

## Настройка вручную

В `%APPDATA%/Aurent Cashier/config.json` (или userData на Mac):

```json
{
  "scalePort": "COM3",
  "scaleBaudRate": 9600,
  "scaleStableOnly": true
}
```

Или переменные окружения:

- `POS_SCALE_PORT=COM3`
- `POS_SCALE_BAUD=9600`
- `POS_SCALE_MOCK=1` — тест без железа

## Зависимость

```bash
cd desktop-cashier
npm install serialport @serialport/parser-readline --save-optional
npm run rebuild:native
```

Без `serialport` вкладка «Весы» в модалке покажет подсказку по установке.

## Фронт

`web-frontend/src/scales/` — мост и хук `useScaleWeight`.
