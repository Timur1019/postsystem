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
  → printShelfLabelUnified (preferDriverPrint)
      1. HTML + printLabelPage (драйвер, XP-365B и аналоги)
      2. ESC/POS — запасной путь (printLabelsEscpos)
```

Принтер: Aurent → «Принтер штрих-кодов». Размер бумаги при `autoLabelPrint` — из `resolveAutoLabelLayout`.

XP-365B и многие термопринтеры этикеток на Windows игнорируют сырой ESC/POS — поэтому основной путь через драйвер.

## Режимы

- `autoLabelPrint={true}` — авторазмер (страница `/users/barcode-print`).
- `autoLabelPrint={false}` — ручные настройки в `localStorage`.
