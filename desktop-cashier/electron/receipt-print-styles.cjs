/** Полные стили чека для скрытого окна печати (без Tailwind). */
const RECEIPT_PRINT_CSS = `
@page { size: 80mm auto; margin: 0; }
html {
  color-scheme: light;
}
html, body {
  margin: 0;
  padding: 0;
  background: #fff !important;
  background-color: #fff !important;
  color: #000;
  width: 80mm;
  max-width: 80mm;
}
body {
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
#receipt-print-area, .receipt-print-root {
  width: 76mm;
  max-width: 76mm;
  margin: 0 auto;
  padding: 1mm 2mm;
  box-sizing: border-box;
  background: #fff;
  color: #000;
  overflow: visible;
}
#receipt-print-area *, .receipt-print-root * {
  color: #000 !important; opacity: 1 !important; visibility: visible !important;
}
body, #receipt-print-area, .receipt-print-root {
  font-family: 'Courier New', 'Liberation Mono', Consolas, monospace;
  font-size: 13px; line-height: 1.5; font-weight: 700;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.receipt-section { margin-bottom: 0.35em; text-align: left; }
.receipt-section--center { text-align: center; }
.receipt-title { font-size: 15px; font-weight: 700; text-transform: uppercase; text-align: center; margin: 0 0 4px; }
.receipt-subtitle { font-size: 12px; margin: 2px 0; text-align: center; }
.receipt-meta-label { font-weight: 700; }
.receipt-divider { border-top: 1px dashed #000; margin: 6px 0; }
.receipt-row {
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, auto);
  column-gap: 4px; padding: 1px 0; align-items: start;
}
.receipt-row--bold { font-weight: 700; }
.receipt-row__value { text-align: right; word-break: break-word; }
.receipt-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 6px; }
.receipt-meta-grid__full { grid-column: 1 / -1; }
.receipt-items-table__head,
.receipt-items-table__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(2.4em, auto) minmax(4.75em, auto);
  column-gap: 4px; align-items: start;
}
.receipt-items-table__head { margin-bottom: 4px; font-size: 12px; font-weight: 700; }
.receipt-items-table__qty { text-align: center; white-space: nowrap; }
.receipt-items-table__sum { text-align: right; white-space: nowrap; }
.receipt-items-table__name { min-width: 0; word-break: break-word; }
.receipt-items-table__item { border-bottom: 1px dotted #000; padding-bottom: 4px; margin-bottom: 4px; }
.receipt-items-table__item:last-child { border-bottom: 0; }
.receipt-section-title { font-weight: 700; text-transform: uppercase; font-size: 12px; margin: 0 0 2px; }
.receipt-fiscal-sign { font-weight: 700; text-decoration: underline; word-break: break-all; text-align: right; }
.receipt-qr { display: block; margin: 8px auto 0; max-width: 112px; height: auto; }
.receipt-footer { font-size: 12px; text-align: center; margin: 4px 0; }
.receipt-logo { display: block; margin: 0 auto 4px; max-height: 32mm; max-width: 100%; object-fit: contain; }
#receipt-print-area::after { content: ''; display: block; height: 12mm; min-height: 12mm; }
.receipt-print-root--shift { padding-top: 0; }
.receipt-print-root--shift::after { height: 8mm; min-height: 8mm; }
@media print {
  html, body { margin: 0 !important; padding: 0 !important; height: auto !important; background: #fff !important; }
  #receipt-print-area, .receipt-print-root {
    width: 76mm !important; max-width: 76mm !important;
    margin: 0 auto !important;
    padding: 1mm 2mm !important;
    overflow: visible !important;
    page-break-inside: avoid;
  }
}
`;

module.exports = { RECEIPT_PRINT_CSS };
