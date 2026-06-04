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
const { interpolateLabel } = require('../electron/cashier-receipt-escpos/escpos-format.cjs');
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
    companyPhone: '+998 88 646 95 96',
    stir: '123456789',
    virtualRegister: '1',
    fmNumber: 'FM-001',
  },
  receiptFields: {
    logo: false,
    companyName: true,
    companyPhone: true,
    items: true,
    itemIkpu: true,
    itemVatLine: true,
    receiptNo: true,
    grandTotal: true,
    payment: true,
    qrCode: false,
    footer: true,
  },
  labels: {
    phoneLabel: 'Tel',
    date: 'Дата',
    time: 'Время',
    receiptNoShort: 'Номер чека',
    item: 'Товар',
    qtyShort: 'Кол',
    lineTotalShort: 'Сумма',
    vatLineShort: 'НДС {{rate}}%',
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
    setTextDoubleHeight() {},
    setTextNormal() {},
    code128() {},
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

  testSync('interpolateLabel подставляет {{rate}}', () => {
    assert.strictEqual(
      interpolateLabel('НДС {{rate}}%', { rate: '12' }),
      'НДС 12%',
    );
  });

  await testAsync('buildReceiptOnPrinter формирует текст чека', async () => {
    const printer = createMockPrinter();
    await buildReceiptOnPrinter(printer, mockPayload, 'test-job');
    const text = printer.getText();
    assert.ok(text.includes('10042'), 'номер чека');
    assert.ok(!text.includes('{{rate}}'), 'без сырого {{rate}}');
    assert.ok(text.includes('НДС 12%'), 'НДС с подставленной ставкой');
    assert.ok(text.includes('AURENT'), 'компания');
    assert.ok(text.includes('+998'), 'телефон в шапке');
    assert.ok(text.includes('Хлеб'), 'товар');
    assert.ok(text.includes('[CUT]'), 'отрез');
    const raw = printer.getRaw();
    assert.ok(raw.includes(EXIT_CHINESE_MODE), 'выход из китайского режима');
  });

  await testAsync('buildZReportOnPrinter формирует Z-отчёт', async () => {
    const { validateZReportPayload, buildZReportOnPrinter } = require('../electron/cashier-receipt-escpos/escpos-z-report-builder.cjs');
    const zPayload = {
      locale: 'ru',
      z: {
        zNumber: 12,
        brandName: 'AURENT',
        storeName: 'Test Store',
        cashTotal: 100000,
        cardTotal: 50000,
        vatAmount: 12000,
        salesCount: 5,
        returnsCash: 0,
        returnsCard: 0,
        vatReturn: 0,
        returnsCount: 0,
        totalAmount: 150000,
        openedAt: '2026-06-03T08:00:00.000Z',
        closedAt: '2026-06-03T18:00:00.000Z',
      },
      labels: { zReportTitle: 'Z-отчёт', currency: 'сум', grandTotal: 'ИТОГО' },
    };
    validateZReportPayload(zPayload);
    const printer = createMockPrinter();
    buildZReportOnPrinter(printer, zPayload);
    const text = printer.getText();
    assert.ok(text.includes('12'), 'номер Z');
    assert.ok(text.includes('[CUT]'), 'отрез');
  });

  await testAsync('sanitizePayloadForPrint uz labels', async () => {
    const payload = sanitizePayloadForPrint({
      locale: 'uz',
      labels: { item: 'Mahsulot', footer: 'Qo\u2018llash' },
      sale: { receiptNumber: '1', items: [] },
    });
    assert.strictEqual(payload.labels.footer, "Qo'llash");
  });

  await testAsync('buildLabelsOnPrinter ценник 40×30', async () => {
    const { validateLabelPayload, buildLabelsOnPrinter } = require('../electron/cashier-receipt-escpos/escpos-label-builder.cjs');
    const labelPayload = {
      locale: 'ru',
      paperWmm: 40,
      paperHmm: 30,
      copies: 1,
      labelsMeta: { currency: 'сум' },
      labels: [
        {
          productName: 'Молоко 1л',
          barcode: '4870001234567',
          price: 12500,
          variant: 'priceTag',
          showName: true,
          showBarcode: true,
          showPrice: true,
          currency: 'сум',
        },
      ],
    };
    validateLabelPayload(labelPayload);
    const printer = createMockPrinter();
    buildLabelsOnPrinter(printer, labelPayload);
    const text = printer.getText();
    assert.ok(text.includes('12'), 'цена');
    assert.ok(text.includes('Молоко'), 'название');
    assert.ok(text.includes('[CUT]'), 'отрез');
  });

  testSync('wrapTextLines для узкой этикетки', () => {
    const { wrapTextLines } = require('../electron/cashier-receipt-escpos/escpos-label-layout.cjs');
    const lines = wrapTextLines('Очень длинное название товара для полки', 18);
    assert.ok(lines.length >= 2);
    assert.ok(lines.every((l) => l.length <= 18));
  });

  console.log(`\nИтого: ${passed} ok, ${failed} fail`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
