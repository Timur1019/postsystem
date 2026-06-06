/** Нормализует ввод: RCP-… убирается, допускаются 42, 20260607-0042, 202606070042. */
export function parseReceiptLookupInput(raw) {
  let value = String(raw ?? '').trim().toUpperCase().replace(/\s+/g, '');
  if (/^RCP-/i.test(value)) {
    value = value.replace(/^RCP-/i, '');
  }
  value = value.replace(/[^0-9-]/g, '');

  const dashIdx = value.indexOf('-');
  if (dashIdx >= 0) {
    const date = value.slice(0, dashIdx).replace(/\D/g, '').slice(0, 8);
    const seq = value.slice(dashIdx + 1).replace(/\D/g, '').slice(0, 8);
    if (date.length === 8 && seq.length > 0) return `${date}-${seq}`;
    if (date.length > 0) return `${date}-${seq}`;
    return seq;
  }

  const digits = value.replace(/\D/g, '').slice(0, 12);
  if (digits.length > 8) {
    return `${digits.slice(0, 8)}-${digits.slice(8)}`;
  }
  return digits;
}

/** Достаточно ли данных для автопоиска. */
export function isReadyReceiptLookup(code) {
  const c = String(code ?? '').trim();
  if (!c) return false;

  if (c.includes('-')) {
    const dash = c.indexOf('-');
    const date = c.slice(0, dash);
    const seq = c.slice(dash + 1);
    return date.length === 8 && seq.length >= 1;
  }

  const digits = c.replace(/\D/g, '');
  if (digits.length === 12) return true;
  return digits.length >= 1 && digits.length <= 4;
}
