/**
 * Тест сборки TSPL-команд для этикеток (без принтера).
 */
const assert = require('assert');
const { buildTsplBuffer, validateTsplLabelPayload } = require('../electron/label-tspl/tspl-label-builder.cjs');

function testSync(name, fn) {
  try {
    fn();
    console.log(`  ok  ${name}`);
    return true;
  } catch (err) {
    console.error(` FAIL ${name}`, err.message);
    return false;
  }
}

function main() {
  let passed = 0;
  let failed = 0;

  const run = (name, fn) => {
    if (testSync(name, fn)) passed += 1;
    else failed += 1;
  };

  const payload = {
    paperWmm: 40,
    paperHmm: 30,
    padXmm: 2,
    padYmm: 2,
    offsetXmm: 0,
    offsetYmm: 0,
    fontScale: 1,
    rotate180: false,
    gapMm: 2,
    copies: 2,
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

  run('validateTsplLabelPayload', () => {
    validateTsplLabelPayload(payload);
  });

  run('buildTsplBuffer содержит SIZE и BARCODE', () => {
    const buf = buildTsplBuffer(payload);
    assert.ok(Buffer.isBuffer(buf));
    const text = buf.toString('binary');
    assert.ok(text.includes('SIZE 40 mm,30 mm'));
    assert.ok(text.includes('GAP 2 mm,0 mm'));
    assert.ok(text.includes('CODEPAGE 1251'));
    assert.ok(text.includes('BARCODE'));
    assert.ok(text.includes('4870001234567'));
    assert.ok(text.includes('PRINT 2'));
  });

  run('validateTsplLabelPayload без штрихкода', () => {
    assert.throws(() =>
      validateTsplLabelPayload({
        ...payload,
        labels: [{ ...payload.labels[0], barcode: '', showBarcode: true }],
      }),
    );
  });

  run('extractIpv4 из порта Windows', () => {
    const { extractIpv4 } = require('../electron/label-tspl/tspl-auto-detect.cjs');
    assert.strictEqual(extractIpv4('IP_192.168.1.200'), '192.168.1.200');
    assert.strictEqual(extractIpv4('192.168.0.55:9100'), '192.168.0.55');
  });

  console.log(`\nИтого: ${passed} ok, ${failed} fail`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
