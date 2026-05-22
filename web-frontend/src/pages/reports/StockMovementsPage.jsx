import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import { format as fmtDate } from 'date-fns';
import { stockReportApi, storeApi } from '../../services/api';
import ReportDateBar from '../../components/reports/ReportDateBar';
import TablePagination from '../../components/shared/TablePagination';

const TYPES = ['ALL', 'RESTOCK', 'SALE', 'RETURN', 'WRITE_OFF', 'ADJUSTMENT'];

export default function StockMovementsPage() {
  const { t } = useTranslation();
  const [from, setFrom] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [search, setSearch] = useState('');
  const [movementType, setMovementType] = useState('ALL');
  const [storeId, setStoreId] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(30);

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const params = useMemo(
    () => ({
      from, to, page, size: pageSize,
      search: search.trim() || undefined,
      movementType: movementType === 'ALL' ? undefined : movementType,
      storeId: storeId === '' ? undefined : Number(storeId),
    }),
    [from, to, page, pageSize, search, movementType, storeId]
  );

  const { data, isPending } = useQuery({
    queryKey: ['stock-movements', params],
    queryFn: () => stockReportApi.movements(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const rows = data?.content ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.movementsTitle')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.movementsSubtitle')}</p>
      </div>
      <ReportDateBar from={from} to={to} onFrom={setFrom} onTo={setTo} />
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder={t('common.search')}
          className="min-w-[10rem] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <select
          value={movementType}
          onChange={(e) => { setMovementType(e.target.value); setPage(0); }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          {TYPES.map((tp) => (
            <option key={tp} value={tp}>{t(`stockReports.movementTypes.${tp}`, { defaultValue: tp })}</option>
          ))}
        </select>
        <select
          value={storeId}
          onChange={(e) => { setStoreId(e.target.value); setPage(0); }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">{t('stockReports.allStores')}</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600 dark:bg-slate-800/80">
            <tr>
              <th className="px-4 py-3">{t('stockReports.colDate')}</th>
              <th className="px-4 py-3">{t('stockReports.colType')}</th>
              <th className="px-4 py-3">{t('stockReports.colProduct')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colQty')}</th>
              <th className="px-4 py-3">{t('stockReports.colDoc')}</th>
            </tr>
          </thead>
          <tbody>
            {isPending && <tr><td colSpan={5} className="p-6 text-center">{t('common.loading')}</td></tr>}
            {!isPending && rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center">{t('common.noData')}</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-2 whitespace-nowrap">
                  {r.createdAt ? fmtDate(new Date(r.createdAt), 'dd.MM.yy HH:mm') : '—'}
                </td>
                <td className="px-4 py-2">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium dark:bg-slate-800">
                    {t(`stockReports.movementTypes.${r.movementType}`, { defaultValue: r.movementType })}
                  </span>
                </td>
                <td className="px-4 py-2">{r.productName}</td>
                <td className={`px-4 py-2 text-right font-medium ${r.quantity >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {r.quantity > 0 ? `+${r.quantity}` : r.quantity}
                </td>
                <td className="px-4 py-2 text-xs text-slate-500">
                  {r.receiptNumber || r.notes || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={data?.totalElements ?? 0}
          totalPages={data?.totalPages ?? 0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
