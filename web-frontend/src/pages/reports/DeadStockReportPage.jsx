import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { stockReportApi, categoryApi } from '../../services/api';
import ReportExportButton from '../../components/reports/ReportExportButton';
import TablePagination from '../../components/shared/TablePagination';
import { fmtMoney } from '../../utils/formatMoney';

export default function DeadStockReportPage() {
  const { t } = useTranslation();
  const [daysNoSale, setDaysNoSale] = useState(30);
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll().then((r) => r.data),
  });

  const params = useMemo(
    () => ({
      asOfDate: format(new Date(), 'yyyy-MM-dd'),
      daysNoSale,
      page,
      size: pageSize,
      categoryId: categoryId === '' ? undefined : Number(categoryId),
      search: search.trim() || undefined,
    }),
    [daysNoSale, categoryId, search, page, pageSize]
  );

  const exportParams = useMemo(
    () => ({
      asOfDate: format(new Date(), 'yyyy-MM-dd'),
      daysNoSale,
      categoryId: categoryId === '' ? undefined : Number(categoryId),
      search: search.trim() || undefined,
    }),
    [daysNoSale, categoryId, search]
  );

  const { data, isPending } = useQuery({
    queryKey: ['dead-stock', params],
    queryFn: () => stockReportApi.deadStock(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const rows = data?.content ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.deadStockTitle')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.deadStockSubtitle')}</p>
        </div>
        <ReportExportButton
          fetchBlob={() => stockReportApi.exportDeadStock(exportParams)}
          filenamePrefix="dead_stock"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm">
          {t('stockReports.daysNoSale')}
          <input
            type="number"
            min={1}
            value={daysNoSale}
            onChange={(e) => { setDaysNoSale(Number(e.target.value)); setPage(0); }}
            className="w-20 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder={t('common.search')}
          className="min-w-[10rem] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <select
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setPage(0); }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">{t('stockReports.allCategories')}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600 dark:bg-slate-800/80">
            <tr>
              <th className="px-4 py-3">{t('stockReports.colProduct')}</th>
              <th className="px-4 py-3">{t('stockReports.colCategory')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colStock')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colStockValue')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colLastSale')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colDaysIdle')}</th>
            </tr>
          </thead>
          <tbody>
            {isPending && <tr><td colSpan={6} className="px-4 py-8 text-center">{t('common.loading')}</td></tr>}
            {!isPending && rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center">{t('common.noData')}</td></tr>}
            {rows.map((r) => (
              <tr key={r.productId} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3">
                  <div className="font-medium">{r.productName}</div>
                  <div className="text-xs text-slate-500">{r.sku}</div>
                </td>
                <td className="px-4 py-3">{r.categoryName || '—'}</td>
                <td className="px-4 py-3 text-right">{r.stockQuantity}</td>
                <td className="px-4 py-3 text-right">{fmtMoney(r.stockValue)}</td>
                <td className="px-4 py-3 text-right">{r.lastSaleDate ?? '—'}</td>
                <td className="px-4 py-3 text-right font-medium text-amber-700">{r.daysWithoutSale}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination page={page} pageSize={pageSize} total={data?.totalElements ?? 0} totalPages={data?.totalPages ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize} />
    </div>
  );
}
