import { format, parseISO } from 'date-fns';

export function fmtCashRegisterDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = typeof iso === 'string' ? parseISO(iso) : new Date(iso);
    return format(d, 'yyyy-MM-dd HH:mm:ss');
  } catch {
    return '—';
  }
}

export function fmtConfigCount(n) {
  return n === 0 ? '—' : String(n);
}

export function buildPageWindow(page, totalPages, maxButtons = 5) {
  if (totalPages <= 1) return [];
  if (totalPages <= maxButtons) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  let start = Math.max(0, page - 2);
  let end = Math.min(totalPages, start + maxButtons);
  start = Math.max(0, end - maxButtons);
  return Array.from({ length: end - start }, (_, i) => start + i);
}

export function downloadExcelBlob(blobData, filename) {
  const blob = new Blob([blobData], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
