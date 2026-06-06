import { fmtMoney } from './formatMoney';

export const optCls = (active) =>
  `flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
    active
      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
  }`;

export const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white';

export function formatImportMoney(value) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return fmtMoney(n);
}

export function parseMoneyInput(raw) {
  if (raw == null || raw === '') return null;
  const cleaned = String(raw).replace(/\s/g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function parsePercentInput(raw) {
  if (raw == null || raw === '') return null;
  const cleaned = String(raw).replace(/\s/g, '').replace(',', '.');
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function applyMarkup(base, percent) {
  const n = Number(base);
  if (!Number.isFinite(n)) return base;
  const p = Number(percent) || 0;
  return Math.round(n * (1 + p / 100) * 100) / 100;
}

export const normalizeImportStatus = (status) => String(status ?? '').toUpperCase();

export const isRowNew = (row) => normalizeImportStatus(row?.status) === 'NEW';
export const isRowDuplicate = (row) => normalizeImportStatus(row?.status) === 'DUPLICATE';
export const isRowInvalid = (row) => normalizeImportStatus(row?.status) === 'INVALID';

export function buildEditableRows(rows, markupPercent) {
  const map = {};
  rows.forEach((r) => {
    if (!isRowNew(r)) return;
    const base = Number(r.fileSellingPrice);
    map[r.rowNum] = {
      importPrice: applyMarkup(base, markupPercent),
      categoryId: '',
      storeId: '',
      storageLocation: r.storageLocation ?? '',
    };
  });
  return map;
}
