# shelfLabelPrint — этикетки / ценники

## Структура

| Файл | Назначение |
|------|------------|
| `ShelfLabelPrintModal.jsx` | UI модалки |
| `useShelfLabelPrint.js` | Состояние, `printJob`, вызов печати |
| `buildLabelPrintJob.js` | Единый объект для UI и печати |
| `printShelfLabel.js` | Точка входа печати (→ ESC/POS) |
| `resolveAutoLabelLayout.js` | Авторазмер бумаги (мм) |

## Печать

```
buildLabelPrintJob → printShelfLabel(printJob, t)
  → ensureDesktopLabelPrinter
  → printShelfLabelUnified
      1. TSPL (XP-365B по сети, если включено) — desktop:print-label-tspl
      2. HTML + printLabelPage (драйвер Windows)
      3. ESC/POS — запасной путь (printLabelsEscpos)
```

Принтер: Aurent → «Принтер штрих-кодов» (драйвер) **или** TSPL в настройках на `/users/barcode-print`.

XP-365B и многие термопринтеры этикеток на Windows игнорируют сырой ESC/POS — поэтому основной путь через драйвер.

## Размеры (справочник)

Только стандартные рулоны СНГ — `LABEL_SIZE_PRESETS` в `constants.js`. Дефолт: **58×40** (`standard_58_40`).

Категории: микро, стандарт, крупные, маркетплейсы. Размеры > 82 мм помечены как `widePrinterOnly` (не XP-365B).

Профиль Windows должен называться как `profileId` пресета (например `58x40`).

## Режимы

- По умолчанию — **ручной выбор пресета** в модалке (настройки в `localStorage`, `aurent_label_print_settings_v2`).
- Переключатель «Подобрать размер автоматически» — авторазмер из справочника по содержимому этикетки.
