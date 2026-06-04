# shelfLabelPrint — этикетки / ценники

## Структура

| Файл | Назначение |
|------|------------|
| `ShelfLabelPrintModal.jsx` | UI модалки |
| `useShelfLabelPrint.js` | Состояние, `printJob`, вызов печати |
| `buildLabelPrintJob.js` | Единый объект для UI и печати |
| `printShelfLabel.js` | Точка входа печати (→ ESC/POS) |
| `resolveAutoLabelLayout.js` | Авторазмер бумаги (мм) |

## Печать (как чек / Z / X на кассе)

```
buildLabelPrintJob → printShelfLabel(printJob, t)
  → ensureDesktopLabelPrinter
  → buildEscposLabelPayload
  → window.desktopCashier.printLabelsEscpos
```

Принтер: Aurent → «Принтер штрих-кодов». Размер бумаги при `autoLabelPrint` — из `resolveAutoLabelLayout`.

## Режимы

- `autoLabelPrint={true}` — авторазмер (страница `/users/barcode-print`).
- `autoLabelPrint={false}` — ручные настройки в `localStorage`.
