const {
  getDb,
  persistDb,
  rowsFromStmt,
  parseJson,
  getMeta,
  setMeta,
  ensureDeviceId,
} = require('./connection.cjs');

async function importBootstrap(payload) {
  const db = await getDb();
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
  const db = await getDb();
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
  const db = await getDb();
  return rowsFromStmt(db.prepare('SELECT payload_json FROM categories ORDER BY name')).map((r) =>
    parseJson(r.payload_json, {}),
  );
}

async function searchProducts({ search = '', categoryId, limit = 200, offset = 0 } = {}) {
  const db = await getDb();
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
  return rowsFromStmt(stmt).map((r) => parseJson(r.payload_json, null)).filter(Boolean);
}

async function getProductByBarcode(barcode) {
  const db = await getDb();
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
  const db = await getDb();
  const stmt = db.prepare('SELECT payload_json FROM products WHERE id = ? AND active = 1 LIMIT 1');
  stmt.bind([String(id)]);
  const rows = rowsFromStmt(stmt);
  return rows.length ? parseJson(rows[0].payload_json, null) : null;
}

async function decreaseLocalStock(productId, quantity) {
  const db = await getDb();
  db.run(
    'UPDATE products SET stock_quantity = CASE WHEN stock_quantity - ? < 0 THEN 0 ELSE stock_quantity - ? END WHERE id = ?',
    [Number(quantity), Number(quantity), String(productId)],
  );
  persistDb();
}

module.exports = {
  importBootstrap,
  getBootstrapStatus,
  listCategories,
  searchProducts,
  getProductByBarcode,
  getProductById,
  decreaseLocalStock,
};
