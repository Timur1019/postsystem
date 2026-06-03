#!/usr/bin/env node
/**
 * Smoke: валидация payload и сборка текста чека без принтера.
 * npm run test:escpos
 */
const assert = require('assert');
const { validatePayload, buildReceiptOnPrinter } = require('../electron/cashier-receipt-escpos/escpos-sale-builder.cjs');

const mockPayload = {
  sale: {
    id: 'test-sale-1',
    receiptNumber: '10042',
    cashierName: 'Test Cashier',
    storeName: 'AURENT TEST',
    createdAt: '2026-06-03T12:00:00.000Z',
    totalAmount: 125000,
    taxTotal: 13392.86,
    discountTotal: 0,
    paymentMethod: 'CASH',
    amountTendered: 130000,
    changeGiven: 5000,
    items: [{ productName: 'Хлеб', quantity: 2, lineTotal: 25000 }],
  },
  branding: {
    companyName: 'AURENT TEST',
    companyAddress: 'Tashkent',
    stir: '123456789',
    virtualRegister: '1',
    fmNumber: 'FM-001',
  },
  receiptFields: {
    logo: false,
    companyName: true,
    items: true,
    grandTotal: true,
    payment: true,
    qrCode: false,
    footer: true,
  },
  labels: {
    date: 'Дата',
    time: 'Время',
    item: 'Товар',
    qtyShort: 'Кол',
    lineTotalShort: 'Сумма',
    grandTotal: 'ИТОГО',
    currency: 'сум',
    footer: 'Спасибо',
  },
};

/** Минимальный mock ThermalPrinter для buildReceiptOnPrinter. */
function createMockPrinter() {
  const lines = [];
  return {
    clear() {
      lines.length = 0;
    },
    alignCenter() {
      lines.push('[C]');
    },
    alignLeft() {
      lines.push('[L]');
    },
    bold() {},
    println(text) {
      lines.push(String(text));
    },
    leftRight(a, b) {
      lines.push(`${a} | ${b}`);
    },
    drawLine() {
      lines.push('---');
    },
    newLine() {},
    tableCustom(rows) {
      lines.push(rows.map((r) => r.text).join(' '));
    },
    printQR() {},
    cut() {
      lines.push('[CUT]');
    },
    getText() {
      return lines.join('\n');
    },
    async printImage() {},
  };
}

let passed = 0;
let failed = 0;

function testSync(name, fn) {
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

async function testAsync(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function main() {
  console.log('Aurent — тест ESC/POS build\n');

  testSync('validatePayload принимает mock sale', () => {
    validatePayload(mockPayload);
  });

  await testAsync('buildReceiptOnPrinter формирует текст чека', async () => {
    const printer = createMockPrinter();
    await buildReceiptOnPrinter(printer, mockPayload, 'test-job');
    const text = printer.getText();
    assert.ok(text.includes('10042'), 'номер чека');
    assert.ok(text.includes('AURENT'), 'компания');
    assert.ok(text.includes('Хлеб'), 'товар');
    assert.ok(text.includes('[CUT]'), 'отрез');
  });

  console.log(`\nИтого: ${passed} ok, ${failed} fail`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
