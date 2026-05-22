import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import { format as fmtDate } from 'date-fns';
import { stockReportApi, storeApi } from '../../services/api';
import ReportDateBar from '../../components/reports/ReportDateBar';
import ReportExportButton from '../../components/reports/ReportExportButton';
import TablePagination from '../../components/shared/TablePagination';

export default function StockAdjustmentsReportPage() {
  const { t } = useTranslation();
  const [from, setFrom] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [search, setSearch] = useState('');
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
      storeId: storeId === '' ? undefined : Number(storeId),
    }),
    [from, to, page, pageSize, search, storeId]
  );

  const exportParams = useMemo(
    () => ({
      from, to,
      search: search.trim() || undefined,
      storeId: storeId === '' ? undefined : Number(storeId),
    }),
    [from, to, search, storeId]
  );

  const { data, isPending } = useQuery({
    queryKey: ['stock-adjustments', params],
    queryFn: () => stockReportApi.adjustments(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const rows = data?.content ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.adjustmentsTitle')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.adjustmentsSubtitle')}</p>
        </div>
        <ReportExportButton
          fetchBlob={() => stockReportApi.exportAdjustments(exportParams)}
          filenamePrefix="stock_adjustments"
          disabled={!from || !to}
        />
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
              <th className="px-4 py-3">{t('stockReports.colProduct')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colQty')}</th>
              <th className="px-4 py-3">{t('stockReports.colStore')}</th>
              <th className="px-4 py-3">{t('stockReports.colUser')}</th>
            </tr>
          </thead>
          <tbody>
            {isPending && <tr><td colSpan={5} className="px-4 py-8 text-center">{t('common.loading')}</td></tr>}
            {!isPending && rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center">{t('common.noData')}</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3">{fmtDate(new Date(r.createdAt), 'dd.MM.yyyy HH:mm')}</td>
                <td className="px-4 py-3">{r.productName}</td>
                <td className={`px-4 py-3 text-right font-medium ${r.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {r.quantity > 0 ? '+' : ''}{r.quantity}
                </td>
                <td className="px-4 py-3">{r.storeName ?? '—'}</td>
                <td className="px-4 py-3">{r.createdByName ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination page={page} pageSize={pageSize} total={data?.totalElements ?? 0} totalPages={data?.totalPages ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize} />
    </div>
  );
}
