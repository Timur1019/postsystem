import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { stockReportApi, categoryApi } from '../../services/api';
import ReportExportButton from '../../components/reports/ReportExportButton';
import TablePagination from '../../components/shared/TablePagination';
import { fmtMoney } from '../../utils/formatMoney';

export default function StockBalancesReportPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [onlyWithStock, setOnlyWithStock] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll().then((r) => r.data),
  });

  const params = useMemo(
    () => ({
      page,
      size: pageSize,
      onlyWithStock,
      categoryId: categoryId === '' ? undefined : Number(categoryId),
      search: search.trim() || undefined,
    }),
    [page, pageSize, onlyWithStock, categoryId, search]
  );

  const exportParams = useMemo(
    () => ({
      onlyWithStock,
      categoryId: categoryId === '' ? undefined : Number(categoryId),
      search: search.trim() || undefined,
    }),
    [onlyWithStock, categoryId, search]
  );

  const { data, isPending } = useQuery({
    queryKey: ['stock-balances', params],
    queryFn: () => stockReportApi.balances(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const rows = data?.content ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.balancesTitle')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.balancesSubtitle')}</p>
        </div>
        <ReportExportButton
          fetchBlob={() => stockReportApi.exportBalances(exportParams)}
          filenamePrefix="stock_balances"
        />
      </div>
      <div className="flex flex-wrap gap-3">
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
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyWithStock} onChange={(e) => { setOnlyWithStock(e.target.checked); setPage(0); }} />
          {t('stockReports.onlyWithStock')}
        </label>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600 dark:bg-slate-800/80">
            <tr>
              <th className="px-4 py-3">{t('stockReports.colProduct')}</th>
              <th className="px-4 py-3">{t('stockReports.colCategory')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colStock')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colMin')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colStockValue')}</th>
            </tr>
          </thead>
          <tbody>
            {isPending && <tr><td colSpan={5} className="px-4 py-8 text-center">{t('common.loading')}</td></tr>}
            {!isPending && rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center">{t('common.noData')}</td></tr>}
            {rows.map((r) => (
              <tr key={r.productId} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-medium">{r.productName}</td>
                <td className="px-4 py-3">{r.categoryName || '—'}</td>
                <td className="px-4 py-3 text-right">{r.stockQuantity}</td>
                <td className="px-4 py-3 text-right">{r.lowStockAlert}</td>
                <td className="px-4 py-3 text-right">{fmtMoney(r.stockValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination page={page} pageSize={pageSize} total={data?.totalElements ?? 0} totalPages={data?.totalPages ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize} />
    </div>
  );
}
