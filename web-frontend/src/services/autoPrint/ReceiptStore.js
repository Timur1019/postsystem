/**
 * In-memory хранилище чеков для автопечати (независимо от страницы кассы).
 * Источник правды после успешной продажи — snapshot sale с API.
 */

/** @typedef {'queued'|'rendering'|'ready'|'printing'|'done'|'failed'} ReceiptJobStatus */

/**
 * @typedef {object} ReceiptRecord
 * @property {object} sale
 * @property {ReceiptJobStatus} status
 * @property {number} createdAt
 * @property {string|null} [errorMessage]
 */

const records = new Map();
let previewReceiptNumber = null;
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

export function subscribeReceiptStore(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return {
    previewReceiptNumber,
    records: new Map(records),
  };
}

export function putReceipt(sale) {
  const receiptNumber = sale?.receiptNumber;
  if (!receiptNumber) return null;
  records.set(receiptNumber, {
    sale,
    status: 'queued',
    createdAt: Date.now(),
    errorMessage: null,
  });
  emit();
  return receiptNumber;
}

export function getReceipt(receiptNumber) {
  return records.get(receiptNumber) ?? null;
}

export function updateStatus(receiptNumber, status, errorMessage = null) {
  const rec = records.get(receiptNumber);
  if (!rec) return;
  records.set(receiptNumber, {
    ...rec,
    status,
    errorMessage: errorMessage ?? rec.errorMessage,
  });
  emit();
}

export function setPreviewReceipt(receiptNumber) {
  previewReceiptNumber = receiptNumber ?? null;
  emit();
}

export function getPreviewReceipt() {
  return previewReceiptNumber ? getReceipt(previewReceiptNumber) : null;
}

export function clearPreview() {
  previewReceiptNumber = null;
  emit();
}

export function removeReceipt(receiptNumber) {
  records.delete(receiptNumber);
  if (previewReceiptNumber === receiptNumber) {
    previewReceiptNumber = null;
  }
  emit();
}

export function pruneOldReceipts(maxAgeMs = 30 * 60 * 1000) {
  const cutoff = Date.now() - maxAgeMs;
  for (const [id, rec] of records) {
    if (rec.createdAt < cutoff && (rec.status === 'done' || rec.status === 'failed')) {
      records.delete(id);
    }
  }
  emit();
}
