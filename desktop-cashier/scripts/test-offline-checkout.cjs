#!/usr/bin/env node
/**
 * Smoke-тесты офлайн-кассы: probe сети, SQLite смена + продажа.
 * Запуск: npm run test:offline  (из desktop-cashier/)
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aurent-offline-test-'));

// Mock Electron до загрузки offline DB
const electronPath = require.resolve('electron');
require.cache[electronPath] = {
  id: electronPath,
  filename: electronPath,
  loaded: true,
  exports: {
    app: {
      getPath: () => tmpDir,
      isPackaged: false,
      getAppPath: () => path.join(__dirname, '..'),
    },
  },
};

const {
  collectConnectivityProbeOrigins,
  collectBackendOrigins,
} = require('../electron/core/api-origin.cjs');
const localDb = require('../electron/offline/index.cjs');

let passed = 0;
let failed = 0;

function test(name, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      passed += 1;
      console.log(`  ✓ ${name}`);
    })
    .catch((err) => {
      failed += 1;
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      if (err.stack) console.error(err.stack.split('\n').slice(1, 3).join('\n'));
    });
}

const prodCfg = {
  useEmbedded: true,
  embeddedPort: 5199,
  backendOrigin: 'http://111.88.132.126:8081',
  apiHealthUrl: 'http://111.88.132.126:8081/api/v1/actuator/health',
};

console.log('Aurent — тесты офлайн-кассы\n');
console.log(`temp DB: ${tmpDir}\n`);

async function run() {
  await test('probe: локальный embedded-прокси не проверяется', () => {
    const probe = collectConnectivityProbeOrigins(prodCfg);
    assert.ok(!probe.some((o) => o.includes('127.0.0.1:5199')));
    assert.ok(probe.includes('http://111.88.132.126:8081'));
  });

  await test('API: embedded-прокси остаётся для запросов UI', () => {
    const api = collectBackendOrigins(prodCfg);
    assert.ok(api.some((o) => o.includes('127.0.0.1:5199')));
    assert.ok(api.includes('http://111.88.132.126:8081'));
  });

  await test('SQLite: синхронизация онлайн-смены в локальную', async () => {
    const shift = await localDb.syncServerShiftToLocal({
      storeId: 1,
      cashierId: '42',
      cashierName: 'Test Cashier',
      storeName: 'Test Store',
      shift: {
        id: 9001,
        status: 'OPEN',
        openedAt: '2026-06-10T10:00:00.000Z',
        saleCount: 0,
        totalAmount: 0,
        cashAmount: 0,
        cardAmount: 0,
      },
    });
    assert.ok(shift);
    assert.strictEqual(shift.status, 'OPEN');
    assert.strictEqual(shift.storeId, 1);

    const row = await localDb.getOpenShift({ storeId: 1, cashierId: '42' });
    assert.ok(row);
    assert.strictEqual(row.status, 'OPEN');
  });

  await test('SQLite: офлайн-продажа сохраняется как pending', async () => {
    const open = await localDb.getOpenShift({ storeId: 1, cashierId: '42' });
    assert.ok(open);

    const clientSaleId = 'sale-test-001';
    const payload = {
      storeId: 1,
      paymentMethod: 'CASH',
      receiptType: 'SALE',
      items: [{ productId: 'p1', quantity: 2, unitPrice: 1000 }],
      orderDiscountAmount: 0,
      orderDiscountPercent: 0,
    };
    const response = {
      id: clientSaleId,
      receiptNumber: 'OFF-20260610-0001',
      createdAt: '2026-06-10T10:05:00.000Z',
      totalAmount: 2000,
      cashAmount: 2000,
      cardAmount: 0,
      offlinePendingSync: true,
      status: 'COMPLETED',
    };

    const saved = await localDb.saveLocalSale({
      clientShiftId: open.client_shift_id,
      payload,
      response,
    });
    assert.strictEqual(saved.clientSaleId, clientSaleId);

    const pending = await localDb.listPendingSales();
    assert.ok(pending.some((p) => p.clientSaleId === clientSaleId));

    const mapped = localDb.mapLocalShift(open);
    assert.strictEqual(mapped.status, 'OPEN');
  });

  await test('SQLite: открытие локальной смены без сервера', async () => {
    const shift = await localDb.openLocalShift({
      storeId: 2,
      cashierId: '77',
      cashierName: 'Offline Only',
      storeName: 'Branch 2',
    });
    assert.ok(shift);
    assert.strictEqual(shift.status, 'OPEN');
    assert.strictEqual(shift.storeId, 2);
  });

  await test('SQLite: списание остатков не падает', async () => {
    const db = await localDb.getDb();
    db.run(
      `INSERT INTO products(id, name, selling_price, tax_rate, barcode, stock_quantity, active, payload_json)
       VALUES ('p1', 'Test', 1000, 12, '123', 10, 1, '{}')`,
    );
    await localDb.decreaseLocalStock('p1', 2);
    const stmt = db.prepare('SELECT stock_quantity FROM products WHERE id = ?');
    stmt.bind(['p1']);
    const row = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    assert.ok(row);
    assert.strictEqual(Number(row.stock_quantity), 8);
  });

  console.log(`\nИтого: ${passed} ok, ${failed} fail`);
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors on Windows
  }
  process.exit(failed > 0 ? 1 : 0);
}

run();
