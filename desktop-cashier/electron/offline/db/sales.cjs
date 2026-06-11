const crypto = require('crypto');
const { getDb, persistDb, rowsFromStmt, parseJson, getMeta, setMeta } = require('./connection.cjs');
const { bumpShiftTotals } = require('./shifts.cjs');

function nextOfflineReceiptNumber({ persist = true } = {}) {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const key = `receiptSeq:${day}`;
  const next = Number(getMeta(key) || '0') + 1;
  setMeta(key, String(next), { persist });
  return `OFF-${day}-${String(next).padStart(4, '0')}`;
}

async function saveLocalSale({ clientShiftId, payload, response }, { persist = true } = {}) {
  const db = await getDb();
  const clientSaleId = response.id || crypto.randomUUID();
  const receiptNumber = response.receiptNumber || nextOfflineReceiptNumber({ persist });
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
  await bumpShiftTotals(clientShiftId, response, { persist });
  if (persist) persistDb();
  return { clientSaleId, receiptNumber, createdAt };
}

async function listPendingSales() {
  const db = await getDb();
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
  const db = await getDb();
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
  const db = await getDb();
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

module.exports = {
  nextOfflineReceiptNumber,
  saveLocalSale,
  listPendingSales,
  listMySales,
  markSalesSynced,
};
