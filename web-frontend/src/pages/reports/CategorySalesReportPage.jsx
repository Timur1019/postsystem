import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import { reportApi, storeApi } from '../../services/api';
import ReportDateBar from '../../components/reports/ReportDateBar';
import ReportExportButton from '../../components/reports/ReportExportButton';
import TablePagination from '../../components/shared/TablePagination';
import { fmtMoney } from '../../utils/formatMoney';

export default function CategorySalesReportPage() {
  const { t } = useTranslation();
  const [from, setFrom] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [storeId, setStoreId] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const params = useMemo(
    () => ({
      from, to, page, size: pageSize,
      storeId: storeId === '' ? undefined : Number(storeId),
    }),
    [from, to, page, pageSize, storeId]
  );

  const exportParams = useMemo(
    () => ({ from, to, storeId: storeId === '' ? undefined : Number(storeId) }),
    [from, to, storeId]
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['reports-sales-by-categories', params],
    queryFn: () => reportApi.salesByCategories(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const rows = data?.content ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.salesByCategoriesTitle')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.salesByCategoriesSubtitle')}</p>
        </div>
        <ReportExportButton
          fetchBlob={() => reportApi.exportSalesByCategories(exportParams)}
          filenamePrefix="sales_by_categories"
          disabled={!from || !to}
        />
      </div>
      <ReportDateBar from={from} to={to} onFrom={setFrom} onTo={setTo} />
      <select
        value={storeId}
        onChange={(e) => { setStoreId(e.target.value); setPage(0); }}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <option value="">{t('stockReports.allStores')}</option>
        {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <ReportTable
        rows={rows}
        isPending={isPending}
        isError={isError}
        error={error}
        t={t}
        cols={['category', 'receipts', 'net', 'revenue', 'margin']}
        renderRow={(r) => (
          <tr key={r.categoryId ?? 'none'} className="border-b border-slate-100 dark:border-slate-800">
            <td className="px-4 py-3 font-medium">{r.categoryName || t('stockReports.uncategorized')}</td>
            <td className="px-4 py-3 text-right">{r.receiptCount}</td>
            <td className="px-4 py-3 text-right">{r.netQuantity}</td>
            <td className="px-4 py-3 text-right">{fmtMoney(r.revenue)}</td>
            <td className="px-4 py-3 text-right text-emerald-700">{fmtMoney(r.margin)}</td>
          </tr>
        )}
      />
      <TablePagination
        page={page}
        pageSize={pageSize}
        total={data?.totalElements ?? 0}
        totalPages={data?.totalPages ?? 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}

function ReportTable({ rows, isPending, isError, error, t, cols, renderRow }) {
  const headers = {
    category: t('stockReports.colCategory'),
    receipts: t('stockReports.colReceipts'),
    net: t('stockReports.colNet'),
    revenue: t('stockReports.colRevenue'),
    margin: t('stockReports.colMargin'),
  };
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600 dark:bg-slate-800/80">
          <tr>
            {cols.map((c) => (
              <th key={c} className={`px-4 py-3 ${c !== 'category' ? 'text-right' : ''}`}>{headers[c]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isPending && <tr><td colSpan={cols.length} className="px-4 py-8 text-center">{t('common.loading')}</td></tr>}
          {isError && <tr><td colSpan={cols.length} className="px-4 py-8 text-center text-red-600">{error?.response?.data?.message ?? t('common.error')}</td></tr>}
          {!isPending && !isError && rows.length === 0 && <tr><td colSpan={cols.length} className="px-4 py-8 text-center">{t('common.noData')}</td></tr>}
          {rows.map(renderRow)}
        </tbody>
      </table>
    </div>
  );
}
