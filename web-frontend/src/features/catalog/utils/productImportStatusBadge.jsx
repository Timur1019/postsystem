import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { normalizeImportStatus } from '../../../utils/productImportUtils';

export function productImportStatusBadge(status, t) {
  const s = normalizeImportStatus(status);
  if (s === 'DUPLICATE') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
        <AlertTriangle size={12} />
        {t('products.import.statusDuplicate')}
      </span>
    );
  }
  if (s === 'INVALID') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800 dark:bg-red-500/20 dark:text-red-300">
        <XCircle size={12} />
        {t('products.import.statusInvalid')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
      <CheckCircle2 size={12} />
      {t('products.import.statusNew')}
    </span>
  );
}
