const crypto = require('crypto');
const { getDb, persistDb, getMeta } = require('./connection.cjs');

async function getOpenShift({ storeId, cashierId }) {
  const db = await getDb();
  const stmt = db.prepare(
    `SELECT * FROM local_shifts
     WHERE store_id = ? AND cashier_id = ? AND status = 'OPEN'
     ORDER BY opened_at DESC LIMIT 1`,
  );
  stmt.bind([Number(storeId), String(cashierId)]);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
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

async function closeLocalShift({ storeId, cashierId }) {
  if (!storeId || !cashierId) return { ok: false };
  const db = await getDb();
  db.run(
    `UPDATE local_shifts SET status = 'CLOSED'
     WHERE store_id = ? AND cashier_id = ? AND status = 'OPEN'`,
    [Number(storeId), String(cashierId)],
  );
  persistDb();
  return { ok: true };
}

async function openLocalShift({ storeId, cashierId, cashierName, storeName }) {
  const db = await getDb();
  const existing = await getOpenShift({ storeId, cashierId });
  if (existing) return mapLocalShift(existing);

  const clientShiftId = crypto.randomUUID();
  const openedAt = new Date().toISOString();
  db.run(
    `INSERT INTO local_shifts(
      client_shift_id, store_id, cashier_id, cashier_name, store_name, opened_at, status
    ) VALUES (?, ?, ?, ?, ?, ?, 'OPEN')`,
    [
      clientShiftId,
      Number(storeId),
      String(cashierId),
      cashierName || '',
      storeName || '',
      openedAt,
    ],
  );
  persistDb();
  return mapLocalShift(await getOpenShift({ storeId, cashierId }));
}

async function syncServerShiftToLocal({ shift, storeId, cashierId, cashierName, storeName }) {
  const db = await getDb();
  if (!shift || shift.status !== 'OPEN') {
    if (storeId && cashierId) {
      await closeLocalShift({ storeId, cashierId });
    }
    return null;
  }

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
  const db = await getDb();
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

module.exports = {
  getOpenShift,
  mapLocalShift,
  closeLocalShift,
  openLocalShift,
  syncServerShiftToLocal,
  bumpShiftTotals,
};
