#!/usr/bin/env node
/**
 * Smoke: валидация payload и сборка текста чека без принтера.
 * npm run test:escpos
 */
const assert = require('assert');
const { validatePayload, buildReceiptOnPrinter } = require('../electron/cashier-receipt-escpos/escpos-sale-builder.cjs');
const {
  normalizeLocale,
  resolveCharacterSet,
  normalizePrintText,
  sanitizePayloadForPrint,
  EXIT_CHINESE_MODE,
} = require('../electron/cashier-receipt-escpos/escpos-encoding.cjs');
const { CharacterSet } = require('node-thermal-printer');

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
  locale: 'ru',
};

/** Минимальный mock ThermalPrinter для buildReceiptOnPrinter. */
function createMockPrinter() {
  const lines = [];
  const raw = [];
  return {
    clear() {
      lines.length = 0;
      raw.length = 0;
    },
    append(buf) {
      if (Buffer.isBuffer(buf)) {
        raw.push(buf);
      }
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
    getRaw() {
      return Buffer.concat(raw);
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

  testSync('normalizeLocale: ru / uz', () => {
    assert.strictEqual(normalizeLocale('ru'), 'ru');
    assert.strictEqual(normalizeLocale('ru-RU'), 'ru');
    assert.strictEqual(normalizeLocale('uz'), 'uz');
    assert.strictEqual(normalizeLocale('uz-UZ'), 'uz');
  });

  testSync('resolveCharacterSet по языку', () => {
    assert.strictEqual(resolveCharacterSet('ru'), CharacterSet.PC866_CYRILLIC2);
    assert.strictEqual(resolveCharacterSet('uz'), CharacterSet.WPC1252);
  });

  testSync('normalizePrintText для uz apostrophe', () => {
    assert.strictEqual(normalizePrintText('Qo\u2018llash', 'uz'), "Qo'llash");
  });

  await testAsync('buildReceiptOnPrinter формирует текст чека', async () => {
    const printer = createMockPrinter();
    await buildReceiptOnPrinter(printer, mockPayload, 'test-job');
    const text = printer.getText();
    assert.ok(text.includes('10042'), 'номер чека');
    assert.ok(text.includes('AURENT'), 'компания');
    assert.ok(text.includes('Хлеб'), 'товар');
    assert.ok(text.includes('[CUT]'), 'отрез');
    const raw = printer.getRaw();
    assert.ok(raw.includes(EXIT_CHINESE_MODE), 'выход из китайского режима');
  });

  await testAsync('sanitizePayloadForPrint uz labels', async () => {
    const payload = sanitizePayloadForPrint({
      locale: 'uz',
      labels: { item: 'Mahsulot', footer: 'Qo\u2018llash' },
      sale: { receiptNumber: '1', items: [] },
    });
    assert.strictEqual(payload.labels.footer, "Qo'llash");
  });

  console.log(`\nИтого: ${passed} ok, ${failed} fail`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
