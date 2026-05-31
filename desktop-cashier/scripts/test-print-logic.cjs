#!/usr/bin/env node
/**
 * Smoke-тесты логики печати (без принтера и без Electron UI).
 * Запуск: npm run test:print  (из desktop-cashier/)
 */
const assert = require('assert');
const {
  buildThermalReceiptDocument,
  buildReceiptBodyHtml,
  fmtMoney,
  buildFiscalSign,
} = require('../electron/receipt-html-builder.cjs');
const {
  buildSilentPrintOpts,
  winPrintAttempts,
  paperWidthPx,
} = require('../electron/print-thermal.cjs');
const { matchPrinterName } = require('../electron/printer-match.cjs');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('Aurent — тесты логики печати\n');

test('buildThermalReceiptDocument включает текст чека и скрипт готовности', () => {
  const body = '<div id="receipt-print-area"><p class="receipt-title">AURENT</p><p>Чек №123</p></div>';
  const doc = buildThermalReceiptDocument(body);
  assert.ok(doc.includes('receipt-print-area'), 'должен быть receipt-print-area');
  assert.ok(doc.includes('AURENT'), 'должен быть текст чека');
  assert.ok(doc.includes('__posReceiptReady'), 'должен быть флаг готовности');
  assert.ok(doc.includes('@page'), 'должен быть @page для 80mm');
  assert.ok(doc.includes('20mm'), 'должен быть запас под отрез');
});

test('buildSilentPrintOpts без pageSize — для POS-80 на Windows', () => {
  const opts = buildSilentPrintOpts('POS-80 (copy 2)', { paperMm: 80, heightMm: 200 }, false);
  assert.strictEqual(opts.silent, true);
  assert.strictEqual(opts.deviceName, 'POS-80 (copy 2)');
  assert.strictEqual(opts.pageSize, undefined, 'pageSize не задаём — драйвер сам');
});

test('buildSilentPrintOpts с pageSize — запасной вариант', () => {
  const opts = buildSilentPrintOpts('POS-80', { paperMm: 80, heightMm: 150 }, true);
  assert.ok(opts.pageSize);
  assert.strictEqual(opts.pageSize.width, 80000);
  assert.strictEqual(opts.pageSize.height, 150000);
});

test('winPrintAttempts: явное имя default — одна попытка', () => {
  const printers = [
    { name: 'POS-80 (copy 2)', isDefault: true },
    { name: 'Microsoft Print to PDF', isDefault: false },
  ];
  const attempts = winPrintAttempts('POS-80 (copy 2)', printers, true);
  assert.deepStrictEqual(attempts, ['POS-80 (copy 2)']);
});

test('winPrintAttempts (Windows): не default — имя + очередь по умолчанию', () => {
  const printers = [
    { name: 'POS-80 (copy 2)', isDefault: false },
    { name: 'Microsoft Print to PDF', isDefault: true },
  ];
  const attempts = winPrintAttempts('POS-80 (copy 2)', printers, true);
  assert.deepStrictEqual(attempts, ['POS-80 (copy 2)', '']);
});

test('matchPrinterName: POS-80 → POS-80 (copy 2) если только он в списке', () => {
  const printers = [{ name: 'POS-80 (copy 2)', isDefault: true }];
  assert.strictEqual(matchPrinterName('POS-80', printers), 'POS-80 (copy 2)');
});

test('matchPrinterName: точное совпадение', () => {
  const printers = [{ name: 'POS-80 (copy 2)', isDefault: true }];
  assert.strictEqual(matchPrinterName('POS-80 (copy 2)', printers), 'POS-80 (copy 2)');
});

test('buildReceiptBodyHtml: полный чек из JSON продажи', () => {
  const sale = {
    id: 'abc',
    receiptNumber: '1001',
    cashierName: 'Ali',
    storeName: 'Shop',
    createdAt: '2026-05-31T12:00:00.000Z',
    totalAmount: 50000,
    taxTotal: 5357.14,
    discountTotal: 0,
    paymentMethod: 'CASH',
    amountTendered: 50000,
    changeGiven: 0,
    items: [{ productName: 'Test', quantity: 1, lineTotal: 50000 }],
  };
  const html = buildReceiptBodyHtml(sale, { companyName: 'AURENT TEST' });
  assert.ok(html.includes('1001'));
  assert.ok(html.includes('Test'));
  assert.ok(html.includes('50 000.00'));
  assert.ok(html.includes('receipt-items-table__row'));
});

test('paperWidthPx для 80mm >= 280px', () => {
  assert.ok(paperWidthPx(80) >= 280);
});

console.log(`\nИтого: ${passed} ok, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
