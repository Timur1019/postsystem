import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import { stockReportApi, categoryApi } from '../../services/api';
import ReportDateBar from '../../components/reports/ReportDateBar';
import TablePagination from '../../components/shared/TablePagination';
import { fmtMoney } from '../../utils/formatMoney';

export default function StockTurnoverPage() {
  const { t } = useTranslation();
  const [from, setFrom] = useState(format(subDays(new Date(), 29), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll().then((r) => r.data),
  });

  const params = useMemo(
    () => ({
      from, to, page, size: pageSize,
      search: search.trim() || undefined,
      categoryId: categoryId === '' ? undefined : Number(categoryId),
    }),
    [from, to, page, pageSize, search, categoryId]
  );

  const { data, isPending } = useQuery({
    queryKey: ['stock-turnover', params],
    queryFn: () => stockReportApi.turnover(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const rows = data?.content ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.turnoverTitle')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.turnoverSubtitle')}</p>
      </div>
      <ReportDateBar from={from} to={to} onFrom={setFrom} onTo={setTo} />
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder={t('common.search')}
          className="min-w-[12rem] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <select
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setPage(0); }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">{t('stockReports.allCategories')}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-slate-50 text-left uppercase text-slate-600 dark:bg-slate-800/80 dark:text-slate-400">
            <tr>
              <th className="px-3 py-2">{t('stockReports.colProduct')}</th>
              <th className="px-2 py-2 text-right">{t('stockReports.colOpening')}</th>
              <th className="px-2 py-2 text-right">{t('stockReports.colReceived')}</th>
              <th className="px-2 py-2 text-right">{t('stockReports.colSold')}</th>
              <th className="px-2 py-2 text-right">{t('stockReports.colWriteOffShort')}</th>
              <th className="px-2 py-2 text-right">{t('stockReports.colClosing')}</th>
              <th className="px-2 py-2 text-right">{t('stockReports.colStockValue')}</th>
            </tr>
          </thead>
          <tbody>
            {isPending && <tr><td colSpan={7} className="p-6 text-center">{t('common.loading')}</td></tr>}
            {!isPending && rows.length === 0 && <tr><td colSpan={7} className="p-6 text-center">{t('common.noData')}</td></tr>}
            {rows.map((r) => (
              <tr key={r.productId} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-3 py-2">
                  <div className="font-medium">{r.productName}</div>
                  <div className="text-slate-500">{r.sku}</div>
                </td>
                <td className="px-2 py-2 text-right">{r.openingQuantity}</td>
                <td className="px-2 py-2 text-right text-emerald-700">+{r.receivedQuantity}</td>
                <td className="px-2 py-2 text-right text-blue-700">−{r.soldQuantity}</td>
                <td className="px-2 py-2 text-right text-red-700">−{r.writeOffQuantity}</td>
                <td className="px-2 py-2 text-right font-semibold">{r.closingQuantity}</td>
                <td className="px-2 py-2 text-right">{fmtMoney(r.closingCostEstimate)}</td>
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
