const STORAGE_KEY = 'pos-receipt-print-enabled';

/** Печать чека после продажи (касса): по умолчанию включена. */
export function isPosReceiptPrintEnabled() {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    return raw === '1' || raw === 'true';
  } catch {
    return true;
  }
}

export function setPosReceiptPrintEnabled(enabled) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    /* ignore */
  }
}
