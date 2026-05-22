import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import { Search } from 'lucide-react';
import { reportApi, storeApi, categoryApi } from '../../services/api';
import ReportDateBar from '../../components/reports/ReportDateBar';
import ReportExportButton from '../../components/reports/ReportExportButton';
import TablePagination from '../../components/shared/TablePagination';
import { fmtMoney } from '../../utils/formatMoney';

export default function ProductSalesReportPage() {
  const { t } = useTranslation();
  const [from, setFrom] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [search, setSearch] = useState('');
  const [storeId, setStoreId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll().then((r) => r.data),
  });

  const params = useMemo(
    () => ({
      from,
      to,
      page,
      size: pageSize,
      search: search.trim() || undefined,
      storeId: storeId === '' ? undefined : Number(storeId),
      categoryId: categoryId === '' ? undefined : Number(categoryId),
    }),
    [from, to, page, pageSize, search, storeId, categoryId]
  );

  const exportParams = useMemo(
    () => ({
      from,
      to,
      search: search.trim() || undefined,
      storeId: storeId === '' ? undefined : Number(storeId),
      categoryId: categoryId === '' ? undefined : Number(categoryId),
    }),
    [from, to, search, storeId, categoryId]
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['reports-sales-by-products', params],
    queryFn: () => reportApi.salesByProducts(params).then((r) => r.data),
    enabled: !!from && !!to,
    placeholderData: keepPreviousData,
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.salesByProductsTitle')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.salesByProductsSubtitle')}</p>
        </div>
        <ReportExportButton
          fetchBlob={() => reportApi.exportSalesByProducts(exportParams)}
          filenamePrefix="sales_by_products"
          disabled={!from || !to}
        />
      </div>

      <ReportDateBar from={from} to={to} onFrom={setFrom} onTo={setTo} />

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[12rem] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder={t('common.search')}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <select
          value={storeId}
          onChange={(e) => { setStoreId(e.target.value); setPage(0); }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="">{t('stockReports.allStores')}</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setPage(0); }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="">{t('stockReports.allCategories')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">{t('stockReports.colProduct')}</th>
                <th className="px-4 py-3">{t('stockReports.colCategory')}</th>
                <th className="px-4 py-3 text-right">{t('stockReports.colSold')}</th>
                <th className="px-4 py-3 text-right">{t('stockReports.colReturned')}</th>
                <th className="px-4 py-3 text-right">{t('stockReports.colNet')}</th>
                <th className="px-4 py-3 text-right">{t('stockReports.colRevenue')}</th>
                <th className="px-4 py-3 text-right">{t('stockReports.colMargin')}</th>
              </tr>
            </thead>
            <tbody>
              {isPending && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">{t('common.loading')}</td></tr>
              )}
              {isError && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-red-600">{error?.response?.data?.message ?? t('common.error')}</td></tr>
              )}
              {!isPending && !isError && rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">{t('common.noData')}</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.productId} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-white">{r.productName}</div>
                    <div className="text-xs text-slate-500">{r.sku}{r.barcode ? ` · ${r.barcode}` : ''}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.categoryName || '—'}</td>
                  <td className="px-4 py-3 text-right">{r.quantitySold}</td>
                  <td className="px-4 py-3 text-right">{r.quantityReturned}</td>
                  <td className="px-4 py-3 text-right font-medium">{r.netQuantity}</td>
                  <td className="px-4 py-3 text-right">{fmtMoney(r.revenue)}</td>
                  <td className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-400">{fmtMoney(r.margin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
