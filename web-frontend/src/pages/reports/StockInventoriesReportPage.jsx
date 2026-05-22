import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import { format as fmtDate } from 'date-fns';
import { Plus } from 'lucide-react';
import { stockReportApi, storeApi } from '../../services/api';
import ReportDateBar from '../../components/reports/ReportDateBar';
import ReportExportButton from '../../components/reports/ReportExportButton';
import TablePagination from '../../components/shared/TablePagination';

export default function StockInventoriesReportPage() {
  const { t } = useTranslation();
  const [from, setFrom] = useState(format(subDays(new Date(), 29), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [storeId, setStoreId] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const params = useMemo(
    () => ({ from, to, page, size: pageSize, storeId: storeId === '' ? undefined : Number(storeId) }),
    [from, to, page, pageSize, storeId]
  );

  const exportParams = useMemo(
    () => ({ from, to, storeId: storeId === '' ? undefined : Number(storeId) }),
    [from, to, storeId]
  );

  const { data, isPending } = useQuery({
    queryKey: ['stock-inventories-report', params],
    queryFn: () => stockReportApi.inventories(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const rows = data?.content ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.inventoriesTitle')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.inventoriesSubtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReportExportButton
            fetchBlob={() => stockReportApi.exportInventories(exportParams)}
            filenamePrefix="stock_inventories"
            disabled={!from || !to}
          />
          <Link to="/stock/inventories/new" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            <Plus size={16} />
            {t('stockReports.newInventoryDoc')}
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <ReportDateBar from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <select value={storeId} onChange={(e) => { setStoreId(e.target.value); setPage(0); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
          <option value="">{t('stockReports.allStores')}</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase dark:bg-slate-800/80">
            <tr>
              <th className="px-4 py-3">{t('stockReports.colInventoryNo')}</th>
              <th className="px-4 py-3">{t('stockReports.colDate')}</th>
              <th className="px-4 py-3">{t('stockReports.colStore')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colLines')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colDiffSum')}</th>
            </tr>
          </thead>
          <tbody>
            {isPending && <tr><td colSpan={5} className="p-6 text-center">{t('common.loading')}</td></tr>}
            {!isPending && rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center">{t('common.noData')}</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-medium">{r.inventoryNumber}</td>
                <td className="px-4 py-3">{fmtDate(new Date(r.createdAt), 'dd.MM.yyyy HH:mm')}</td>
                <td className="px-4 py-3">{r.storeName ?? '—'}</td>
                <td className="px-4 py-3 text-right">{r.totalLines}</td>
                <td className="px-4 py-3 text-right">{r.totalDifference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination page={page} pageSize={pageSize} total={data?.totalElements ?? 0} totalPages={data?.totalPages ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize} />
    </div>
  );
}
