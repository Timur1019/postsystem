#!/usr/bin/env node
/**
 * Smoke-тесты логики печати (без принтера и без Electron UI).
 * Запуск: npm run test:print  (из desktop-cashier/)
 */
const assert = require('assert');
const { paperWidthPx } = require('../electron/print-thermal.cjs');
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

test('matchPrinterName: POS-80 → POS-80 (copy 2) если только он в списке', () => {
  const printers = [{ name: 'POS-80 (copy 2)', isDefault: true }];
  assert.strictEqual(matchPrinterName('POS-80', printers), 'POS-80 (copy 2)');
});

test('matchPrinterName: точное совпадение', () => {
  const printers = [{ name: 'POS-80 (copy 2)', isDefault: true }];
  assert.strictEqual(matchPrinterName('POS-80 (copy 2)', printers), 'POS-80 (copy 2)');
});

test('paperWidthPx для 80mm >= 280px', () => {
  assert.ok(paperWidthPx(80) >= 280);
});

console.log(`\nИтого: ${passed} ok, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
