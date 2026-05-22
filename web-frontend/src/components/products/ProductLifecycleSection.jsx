import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import { productApi, storeApi } from '../../services/api';
import ReportDateBar from '../reports/ReportDateBar';
import TablePagination from '../shared/TablePagination';
import { fmtMoney } from '../../utils/formatMoney';
import { getApiErrorMessage } from '../../utils/apiError';

const TYPES = ['ALL', 'RESTOCK', 'SALE', 'RETURN', 'WRITE_OFF', 'ADJUSTMENT'];

const qtyClass = (n) => {
  if (n > 0) return 'text-emerald-600 dark:text-emerald-400';
  if (n < 0) return 'text-red-600 dark:text-red-400';
  return 'text-slate-500';
};

export default function ProductLifecycleSection({ productId, showStoreFilter = false }) {
  const { t } = useTranslation();
  const [from, setFrom] = useState(format(subDays(new Date(), 89), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [movementType, setMovementType] = useState('ALL');
  const [storeId, setStoreId] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
    enabled: showStoreFilter,
  });

  const params = useMemo(
    () => ({
      from,
      to,
      page,
      size: pageSize,
      movementType: movementType === 'ALL' ? undefined : movementType,
      storeId: showStoreFilter && storeId !== '' ? Number(storeId) : undefined,
    }),
    [from, to, page, pageSize, movementType, storeId, showStoreFilter]
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['product-lifecycle', productId, params],
    queryFn: () => productApi.lifecycle(productId, params).then((r) => r.data),
    enabled: !!productId,
    placeholderData: keepPreviousData,
  });

  const summary = data?.summary;
  const events = data?.events;
  const rows = events?.content ?? [];
  const total = events?.totalElements ?? 0;
  const totalPages = events?.totalPages ?? 0;

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label={t('products.lifecycle.currentStock')} value={summary.currentStock} />
          <SummaryCard label={t('products.lifecycle.dispatched')} value={summary.stockDispatched} />
          <SummaryCard label={t('products.lifecycle.restocked')} value={summary.restockUnits} />
          <SummaryCard label={t('products.lifecycle.sold')} value={summary.saleUnits} />
          <SummaryCard label={t('products.lifecycle.returned')} value={summary.returnUnits} />
          <SummaryCard label={t('products.lifecycle.writeOff')} value={summary.writeOffUnits} />
          <SummaryCard
            label={t('products.lifecycle.adjustment')}
            value={summary.adjustmentNetUnits}
          />
          {summary.productCreatedAt && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/50">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t('products.lifecycle.createdAt')}
              </div>
              <div className="font-medium text-slate-900 dark:text-white">
                {format(new Date(summary.productCreatedAt), 'dd.MM.yyyy HH:mm')}
              </div>
            </div>
          )}
        </div>
      )}

      <ReportDateBar from={from} to={to} onFrom={(v) => { setFrom(v); setPage(0); }} onTo={(v) => { setTo(v); setPage(0); }} />

      <div className="flex flex-wrap gap-3">
        <select
          value={movementType}
          onChange={(e) => { setMovementType(e.target.value); setPage(0); }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          {TYPES.map((tp) => (
            <option key={tp} value={tp}>
              {t(`stockReports.movementTypes.${tp}`, { defaultValue: tp })}
            </option>
          ))}
        </select>
        {showStoreFilter && (
          <select
            value={storeId}
            onChange={(e) => { setStoreId(e.target.value); setPage(0); }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">{t('stockReports.allStores')}</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      {isError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {getApiErrorMessage(error, t('products.lifecycle.loadFail'))}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600 dark:bg-slate-800/80 dark:text-slate-400">
            <tr>
              <th className="px-3 py-2">{t('products.lifecycle.colDate')}</th>
              <th className="px-3 py-2">{t('products.lifecycle.colType')}</th>
              <th className="px-3 py-2 text-right">{t('products.lifecycle.colDelta')}</th>
              <th className="px-3 py-2 text-right">{t('products.lifecycle.colStockAfter')}</th>
              <th className="px-3 py-2 text-right">{t('products.lifecycle.colUnitCost')}</th>
              <th className="px-3 py-2 text-right">{t('products.lifecycle.colCostDelta')}</th>
              <th className="px-3 py-2">{t('products.lifecycle.colStore')}</th>
              <th className="px-3 py-2">{t('products.lifecycle.colReference')}</th>
              <th className="px-3 py-2">{t('products.lifecycle.colUser')}</th>
              <th className="px-3 py-2">{t('products.lifecycle.colNotes')}</th>
            </tr>
          </thead>
          <tbody>
            {isPending && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-slate-500">
                  {t('common.loading')}
                </td>
              </tr>
            )}
            {!isPending && rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-slate-500">
                  {t('products.lifecycle.empty')}
                </td>
              </tr>
            )}
            {rows.map((ev) => (
              <tr key={ev.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-slate-400">
                  {ev.occurredAt ? format(new Date(ev.occurredAt), 'dd.MM.yyyy HH:mm') : '—'}
                </td>
                <td className="px-3 py-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium dark:bg-slate-800">
                    {t(`stockReports.movementTypes.${ev.eventType}`, { defaultValue: ev.eventType })}
                  </span>
                  {ev.writeOffReason && (
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {t(`stockReports.writeOffReasons.${ev.writeOffReason}`, {
                        defaultValue: ev.writeOffReason,
                      })}
                    </span>
                  )}
                </td>
                <td className={`px-3 py-2 text-right font-semibold ${qtyClass(ev.quantityDelta)}`}>
                  {ev.quantityDelta > 0 ? `+${ev.quantityDelta}` : ev.quantityDelta}
                </td>
                <td className="px-3 py-2 text-right font-medium text-slate-900 dark:text-white">
                  {ev.stockAfter != null ? ev.stockAfter : '—'}
                </td>
                <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-400">
                  {ev.unitCostEstimate != null ? fmtMoney(ev.unitCostEstimate) : '—'}
                </td>
                <td className={`px-3 py-2 text-right ${qtyClass(ev.costDeltaEstimate)}`}>
                  {ev.costDeltaEstimate != null ? fmtMoney(ev.costDeltaEstimate) : '—'}
                </td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{ev.storeName || '—'}</td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                  {ev.referenceLabel ? (
                    <span>
                      {ev.referenceType && (
                        <span className="text-xs text-slate-500">
                          {t(`products.lifecycle.refTypes.${ev.referenceType}`, {
                            defaultValue: ev.referenceType,
                          })}
                          :{' '}
                        </span>
                      )}
                      <span className="font-mono text-xs">{ev.referenceLabel}</span>
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{ev.performedBy || '—'}</td>
                <td className="px-3 py-2 max-w-[12rem] truncate text-slate-500" title={ev.notes || ''}>
                  {ev.notes || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-lg font-semibold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}
