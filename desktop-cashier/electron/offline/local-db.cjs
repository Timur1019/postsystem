const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const crypto = require('crypto');

let sqlInitPromise;
let db;
let dbPath;

const DB_INIT_TIMEOUT_MS = 15_000;

function resolveSqlWasmFile(file) {
  const fileName = path.basename(file);
  const candidates = [
    path.join(process.resourcesPath, 'sql.js', fileName),
    path.join(process.resourcesPath, fileName),
    path.join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', fileName),
    path.join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', fileName),
    path.join(
      process.resourcesPath,
      'app.asar.unpacked',
      'node_modules',
      'sql.js',
      'dist',
      fileName,
    ),
    path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', fileName),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`sql.js wasm not found: ${fileName}`);
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  payload_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT,
  name TEXT NOT NULL,
  selling_price REAL NOT NULL DEFAULT 0,
  tax_rate REAL NOT NULL DEFAULT 12,
  barcode TEXT,
  category_id INTEGER,
  sale_type TEXT,
  unit_code TEXT,
  quantity_scale INTEGER DEFAULT 0,
  allow_fraction INTEGER DEFAULT 0,
  stock_quantity REAL DEFAULT 0,
  active INTEGER DEFAULT 1,
  payload_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS product_barcodes (
  barcode TEXT PRIMARY KEY,
  product_id TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS local_shifts (
  client_shift_id TEXT PRIMARY KEY,
  server_shift_id TEXT,
  store_id INTEGER NOT NULL,
  cashier_id TEXT NOT NULL,
  cashier_name TEXT,
  store_name TEXT,
  opened_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  sale_count INTEGER NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  cash_amount REAL NOT NULL DEFAULT 0,
  card_amount REAL NOT NULL DEFAULT 0,
  vat_amount REAL NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'local'
);
CREATE TABLE IF NOT EXISTS local_sales (
  client_sale_id TEXT PRIMARY KEY,
  client_shift_id TEXT NOT NULL,
  receipt_number TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  response_json TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  server_sale_id TEXT,
  server_receipt_number TEXT,
  created_at TEXT NOT NULL,
  synced_at TEXT,
  error_message TEXT
);
CREATE INDEX IF NOT EXISTS idx_local_sales_sync ON local_sales(sync_status);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
`;

function ensureDeviceId() {
  let id = getMeta('deviceId');
  if (!id) {
    id = crypto.randomUUID();
    setMeta('deviceId', id);
  }
  return id;
}

function dbFilePath() {
  if (!dbPath) {
    dbPath = path.join(app.getPath('userData'), 'pos-offline.db');
  }
  return dbPath;
}

function loadSql() {
  if (!sqlInitPromise) {
    // eslint-disable-next-line global-require
    const initSqlJs = require('sql.js');
    sqlInitPromise = initSqlJs({
      locateFile: resolveSqlWasmFile,
    }).catch((err) => {
      sqlInitPromise = null;
      console.error('[offline-db] sql.js init failed:', err);
      throw err;
    });
  }
  return sqlInitPromise;
}

function withDbTimeout(promise, label = 'offline-db') {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timeout`)), DB_INIT_TIMEOUT_MS);
    }),
  ]);
}

function persistDb() {
  if (!db) return;
  const data = db.export();
  fs.mkdirSync(path.dirname(dbFilePath()), { recursive: true });
  fs.writeFileSync(dbFilePath(), Buffer.from(data));
}

async function getDb() {
  if (db) return db;
  const SQL = await withDbTimeout(loadSql(), 'sql.js load');
  const file = dbFilePath();
  if (fs.existsSync(file)) {
    db = new SQL.Database(fs.readFileSync(file));
  } else {
    db = new SQL.Database();
  }
  db.run(SCHEMA);
  ensureDeviceId();
  persistDb();
  return db;
}

function getMeta(key) {
  if (!db) return null;
  const stmt = db.prepare('SELECT value FROM meta WHERE key = ?');
  stmt.bind([key]);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row?.value ?? null;
}

function setMeta(key, value) {
  db.run(
    'INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, String(value ?? '')],
  );
  persistDb();
}

function rowsFromStmt(stmt) {
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function parseJson(raw, fallback = null) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function nextOfflineReceiptNumber() {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const key = `receiptSeq:${day}`;
  const next = Number(getMeta(key) || '0') + 1;
  setMeta(key, String(next));
  return `OFF-${day}-${String(next).padStart(4, '0')}`;
}

async function importBootstrap(payload) {
  await getDb();
  db.run('BEGIN');
  try {
    db.run('DELETE FROM product_barcodes');
    db.run('DELETE FROM products');
    db.run('DELETE FROM categories');

    if (payload?.storeId != null) setMeta('storeId', String(payload.storeId));
    if (payload?.storeName) setMeta('storeName', payload.storeName);
    if (payload?.syncedAt) setMeta('lastCatalogSyncAt', payload.syncedAt);

    for (const cat of payload?.categories || []) {
      db.run('INSERT INTO categories(id, name, payload_json) VALUES(?, ?, ?)', [
        cat.id,
        cat.name,
        JSON.stringify(cat),
      ]);
    }

    for (const product of payload?.products || []) {
      const barcodes = Array.isArray(product.barcodes) ? product.barcodes : [];
      const primary = product.barcode || barcodes[0] || '';
      db.run(
        `INSERT INTO products(
          id, sku, name, selling_price, tax_rate, barcode, category_id,
          sale_type, unit_code, quantity_scale, allow_fraction, stock_quantity, active, payload_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.id,
          product.sku || '',
          product.name,
          Number(product.sellingPrice ?? 0),
          Number(product.taxRate ?? 12),
          primary,
          product.categoryId ?? null,
          product.saleType || 'PIECE',
          product.unitCode || 'PCS',
          Number(product.quantityScale ?? 0),
          product.allowFraction ? 1 : 0,
          Number(product.stockQuantity ?? 0),
          product.active === false ? 0 : 1,
          JSON.stringify(product),
        ],
      );
      const codes = new Set([primary, ...barcodes].filter(Boolean));
      for (const code of codes) {
        db.run('INSERT OR REPLACE INTO product_barcodes(barcode, product_id) VALUES(?, ?)', [
          code,
          product.id,
        ]);
      }
    }

    setMeta('bootstrapReady', '1');
    db.run('COMMIT');
    persistDb();
    return {
      ok: true,
      productCount: (payload?.products || []).length,
      categoryCount: (payload?.categories || []).length,
      syncedAt: payload?.syncedAt || new Date().toISOString(),
    };
  } catch (err) {
    db.run('ROLLBACK');
    throw err;
  }
}

async function getBootstrapStatus() {
  await getDb();
  return {
    deviceId: ensureDeviceId(),
    storeId: getMeta('storeId') ? Number(getMeta('storeId')) : null,
    storeName: getMeta('storeName') || '',
    lastCatalogSyncAt: getMeta('lastCatalogSyncAt'),
    bootstrapReady: getMeta('bootstrapReady') === '1',
    productCount: rowsFromStmt(db.prepare('SELECT COUNT(*) AS c FROM products'))[0]?.c ?? 0,
    pendingSales: rowsFromStmt(
      db.prepare("SELECT COUNT(*) AS c FROM local_sales WHERE sync_status = 'pending'"),
    )[0]?.c ?? 0,
  };
}

async function listCategories() {
  await getDb();
  return rowsFromStmt(db.prepare('SELECT payload_json FROM categories ORDER BY name')).map((r) =>
    parseJson(r.payload_json, {}),
  );
}

async function searchProducts({ search = '', categoryId, limit = 200, offset = 0 } = {}) {
  await getDb();
  const q = String(search || '').trim().toLowerCase();
  let sql = 'SELECT payload_json FROM products WHERE active = 1';
  const params = [];
  if (categoryId != null && categoryId !== '' && categoryId !== 'ALL') {
    sql += ' AND category_id = ?';
    params.push(Number(categoryId));
  }
  if (q) {
    sql += ' AND (LOWER(name) LIKE ? OR LOWER(sku) LIKE ? OR LOWER(barcode) LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  sql += ' ORDER BY name LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = rowsFromStmt(stmt);
  return rows.map((r) => parseJson(r.payload_json, null)).filter(Boolean);
}

async function getProductByBarcode(barcode) {
  await getDb();
  const code = String(barcode || '').trim();
  if (!code) return null;
  const stmt = db.prepare(
    `SELECT p.payload_json FROM product_barcodes b
     JOIN products p ON p.id = b.product_id
     WHERE b.barcode = ? AND p.active = 1 LIMIT 1`,
  );
  stmt.bind([code]);
  const rows = rowsFromStmt(stmt);
  return rows.length ? parseJson(rows[0].payload_json, null) : null;
}

async function getProductById(id) {
  await getDb();
  const stmt = db.prepare('SELECT payload_json FROM products WHERE id = ? AND active = 1 LIMIT 1');
  stmt.bind([String(id)]);
  const rows = rowsFromStmt(stmt);
  return rows.length ? parseJson(rows[0].payload_json, null) : null;
}

async function getOpenShift({ storeId, cashierId }) {
  await getDb();
  const stmt = db.prepare(
    `SELECT * FROM local_shifts
     WHERE store_id = ? AND cashier_id = ? AND status = 'OPEN'
     ORDER BY opened_at DESC LIMIT 1`,
  );
  stmt.bind([Number(storeId), String(cashierId)]);
  const rows = rowsFromStmt(stmt);
  return rows[0] || null;
}

function mapLocalShift(row) {
  if (!row) return null;
  return {
    id: row.client_shift_id,
    clientShiftId: row.client_shift_id,
    serverShiftId: row.server_shift_id || null,
    storeId: row.store_id,
    storeName: row.store_name || getMeta('storeName') || '',
    cashierName: row.cashier_name || '',
    status: row.status,
    openedAt: row.opened_at,
    closedAt: null,
    saleCount: row.sale_count || 0,
    totalAmount: row.total_amount || 0,
    cashAmount: row.cash_amount || 0,
    cardAmount: row.card_amount || 0,
    vatAmount: row.vat_amount || 0,
    zReportId: null,
    offline: true,
  };
}

async function openLocalShift({ storeId, cashierId, cashierName, storeName }) {
  await getDb();
  const existing = await getOpenShift({ storeId, cashierId });
  if (existing) return mapLocalShift(existing);

  const clientShiftId = crypto.randomUUID();
  const openedAt = new Date().toISOString();
  db.run(
    `INSERT INTO local_shifts(
      client_shift_id, store_id, cashier_id, cashier_name, store_name, opened_at, status
    ) VALUES (?, ?, ?, ?, ?, ?, 'OPEN')`,
    [clientShiftId, Number(storeId), String(cashierId), cashierName || '', storeName || ''],
  );
  persistDb();
  return mapLocalShift(await getOpenShift({ storeId, cashierId }));
}

/** Копирует открытую смену с сервера в SQLite — чтобы офлайн продолжал ту же смену. */
async function syncServerShiftToLocal({ shift, storeId, cashierId, cashierName, storeName }) {
  await getDb();
  if (!shift || shift.status !== 'OPEN') return null;

  const existing = await getOpenShift({ storeId, cashierId });
  const serverId = String(shift.id);
  const openedAt = shift.openedAt || new Date().toISOString();
  const saleCount = Number(shift.saleCount ?? 0);
  const totalAmount = Number(shift.totalAmount ?? 0);
  const cashAmount = Number(shift.cashAmount ?? 0);
  const cardAmount = Number(shift.cardAmount ?? 0);
  const resolvedStoreName = storeName || shift.storeName || getMeta('storeName') || '';
  const resolvedCashierName = cashierName || shift.cashierName || '';

  if (existing) {
    db.run(
      `UPDATE local_shifts SET
        server_shift_id = ?,
        cashier_name = ?,
        store_name = ?,
        opened_at = ?,
        sale_count = ?,
        total_amount = ?,
        cash_amount = ?,
        card_amount = ?,
        status = 'OPEN'
       WHERE client_shift_id = ?`,
      [
        serverId,
        resolvedCashierName,
        resolvedStoreName,
        openedAt,
        saleCount,
        totalAmount,
        cashAmount,
        cardAmount,
        existing.client_shift_id,
      ],
    );
  } else {
    const clientShiftId = crypto.randomUUID();
    db.run(
      `INSERT INTO local_shifts(
        client_shift_id, server_shift_id, store_id, cashier_id, cashier_name, store_name,
        opened_at, status, sale_count, total_amount, cash_amount, card_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?, ?, ?)`,
      [
        clientShiftId,
        serverId,
        Number(storeId),
        String(cashierId),
        resolvedCashierName,
        resolvedStoreName,
        openedAt,
        saleCount,
        totalAmount,
        cashAmount,
        cardAmount,
      ],
    );
  }
  persistDb();
  return mapLocalShift(await getOpenShift({ storeId, cashierId }));
}

async function bumpShiftTotals(clientShiftId, saleResponse) {
  await getDb();
  db.run(
    `UPDATE local_shifts SET
      sale_count = sale_count + 1,
      total_amount = total_amount + ?,
      cash_amount = cash_amount + ?,
      card_amount = card_amount + ?
     WHERE client_shift_id = ?`,
    [
      Number(saleResponse.totalAmount ?? 0),
      Number(saleResponse.cashAmount ?? 0),
      Number(saleResponse.cardAmount ?? 0),
      clientShiftId,
    ],
  );
  persistDb();
}

async function saveLocalSale({ clientShiftId, payload, response }) {
  await getDb();
  const clientSaleId = response.id || crypto.randomUUID();
  const receiptNumber = response.receiptNumber || nextOfflineReceiptNumber();
  const createdAt = response.createdAt || new Date().toISOString();
  db.run(
    `INSERT INTO local_sales(
      client_sale_id, client_shift_id, receipt_number, payload_json, response_json,
      sync_status, created_at
    ) VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    [
      clientSaleId,
      clientShiftId,
      receiptNumber,
      JSON.stringify(payload),
      JSON.stringify({ ...response, id: clientSaleId, receiptNumber, createdAt }),
      createdAt,
    ],
  );
  await bumpShiftTotals(clientShiftId, response);
  persistDb();
  return { clientSaleId, receiptNumber, createdAt };
}

async function listPendingSales() {
  await getDb();
  const rows = rowsFromStmt(
    db.prepare(
      `SELECT s.*, sh.opened_at AS shift_opened_at, sh.store_id, sh.cashier_id
       FROM local_sales s
       JOIN local_shifts sh ON sh.client_shift_id = s.client_shift_id
       WHERE s.sync_status = 'pending'
       ORDER BY s.created_at ASC`,
    ),
  );
  return rows.map((row) => ({
    clientSaleId: row.client_sale_id,
    clientShiftId: row.client_shift_id,
    receiptNumber: row.receipt_number,
    createdAt: row.created_at,
    shiftOpenedAt: row.shift_opened_at,
    storeId: row.store_id,
    cashierId: row.cashier_id,
    payload: parseJson(row.payload_json, {}),
    response: parseJson(row.response_json, {}),
  }));
}

async function listMySales({ shiftId, limit = 50 } = {}) {
  await getDb();
  let sql = 'SELECT response_json FROM local_sales WHERE 1=1';
  const params = [];
  if (shiftId) {
    sql += ' AND client_shift_id = ?';
    params.push(String(shiftId));
  }
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(Number(limit));
  const stmt = db.prepare(sql);
  stmt.bind(params);
  return rowsFromStmt(stmt).map((r) => parseJson(r.response_json, null)).filter(Boolean);
}

async function markSalesSynced(results) {
  await getDb();
  db.run('BEGIN');
  try {
    for (const item of results || []) {
      if (!item?.clientSaleId) continue;
      const status = item.status === 'FAILED' ? 'failed' : 'sent';
      db.run(
        `UPDATE local_sales SET
          sync_status = ?,
          server_sale_id = ?,
          server_receipt_number = ?,
          synced_at = ?,
          error_message = ?
         WHERE client_sale_id = ?`,
        [
          status,
          item.serverSaleId || null,
          item.serverReceiptNumber || null,
          new Date().toISOString(),
          item.errorMessage || null,
          item.clientSaleId,
        ],
      );
    }
    db.run('COMMIT');
    persistDb();
  } catch (err) {
    db.run('ROLLBACK');
    throw err;
  }
  return { ok: true };
}

async function decreaseLocalStock(productId, quantity) {
  await getDb();
  db.run(
    'UPDATE products SET stock_quantity = CASE WHEN stock_quantity - ? < 0 THEN 0 ELSE stock_quantity - ? END WHERE id = ?',
    [Number(quantity), Number(quantity), String(productId)],
  );
  persistDb();
}

module.exports = {
  getDb,
  ensureDeviceId,
  importBootstrap,
  getBootstrapStatus,
  listCategories,
  searchProducts,
  getProductByBarcode,
  getProductById,
  getOpenShift,
  openLocalShift,
  syncServerShiftToLocal,
  mapLocalShift,
  saveLocalSale,
  listPendingSales,
  listMySales,
  markSalesSynced,
  decreaseLocalStock,
  nextOfflineReceiptNumber,
};
