import { format, parseISO } from 'date-fns';
import { ORDER_STATUS_LABELS } from '../constants';

export function fmtOrderDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = typeof iso === 'string' ? parseISO(iso) : new Date(iso);
    return format(d, 'yyyy-MM-dd HH:mm');
  } catch {
    return '—';
  }
}

export function orderStatusLabel(t, code) {
  return code && ORDER_STATUS_LABELS[code] ? t(ORDER_STATUS_LABELS[code]) : code ?? '—';
}
