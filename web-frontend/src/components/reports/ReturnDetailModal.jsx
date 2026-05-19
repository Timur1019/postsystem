import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { returnApi } from '../../services/api';

import { fmtMoney } from '../../utils/formatMoney';

function fmtAt(iso) {
  try {
    return format(typeof iso === 'string' ? parseISO(iso) : new Date(iso), 'dd.MM.yyyy HH:mm');
  } catch {
    return '—';
  }
}

function InfoRow({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}

export default function ReturnDetailModal({ open, returnId, reasonPreview, onClose }) {
  const { t } = useTranslation();

  const { data: sale, isPending, isError, error } = useQuery({
    queryKey: ['return-detail', returnId],
    queryFn: () => returnApi.getById(returnId).then((r) => r.data),
    enabled: open && !!returnId,
  });

  if (!open) return null;

  const reason = reasonPreview?.trim() || '—';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('returnsModule.detailTitle')}</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">
          {isPending && <p className="py-8 text-center text-sm text-slate-500">{t('common.loading')}</p>}
          {isError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {error?.response?.data?.message ?? t('returnsModule.loadError')}
            </p>
          )}
          {sale && (
            <div className="space-y-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                <InfoRow label={t('returnsModule.colDate')} value={fmtAt(sale.createdAt)} />
                <InfoRow label={t('returnsModule.colFiscal')} value={sale.receiptNumber} />
                <InfoRow label={t('returnsModule.colStore')} value={sale.storeName ?? '—'} />
                <InfoRow label={t('returnsModule.filters.cashierName')} value={sale.cashierName ?? '—'} />
                <InfoRow label={t('common.status')} value={sale.status} />
                <InfoRow label={t('returnsModule.colReason')} value={reason} />
                <InfoRow label={t('returnsModule.colAmount')} value={fmtMoney(sale.totalAmount)} />
              </dl>
              {sale.items?.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-700 dark:bg-slate-800/50">
                        <th className="px-3 py-2">{t('products.colName')}</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right">{t('returnsModule.colAmount')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sale.items.map((line, i) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="px-3 py-2">{line.productName}</td>
                          <td className="px-3 py-2 text-right">{line.quantity}</td>
                          <td className="px-3 py-2 text-right">{fmtMoney(line.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
