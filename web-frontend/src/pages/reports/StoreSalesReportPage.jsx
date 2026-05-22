import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import { reportApi } from '../../services/api';
import ReportDateBar from '../../components/reports/ReportDateBar';
import ReportExportButton from '../../components/reports/ReportExportButton';
import TablePagination from '../../components/shared/TablePagination';
import { fmtMoney } from '../../utils/formatMoney';

export default function StoreSalesReportPage() {
  const { t } = useTranslation();
  const [from, setFrom] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const params = useMemo(() => ({ from, to, page, size: pageSize }), [from, to, page, pageSize]);
  const exportParams = useMemo(() => ({ from, to }), [from, to]);

  const { data, isPending } = useQuery({
    queryKey: ['reports-sales-by-stores', params],
    queryFn: () => reportApi.salesByStores(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const rows = data?.content ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.salesByStoresTitle')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.salesByStoresSubtitle')}</p>
        </div>
        <ReportExportButton
          fetchBlob={() => reportApi.exportSalesByStores(exportParams)}
          filenamePrefix="sales_by_stores"
          disabled={!from || !to}
        />
      </div>
      <ReportDateBar from={from} to={to} onFrom={setFrom} onTo={setTo} />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600 dark:bg-slate-800/80">
            <tr>
              <th className="px-4 py-3">{t('stockReports.colStore')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colReceipts')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colNet')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colRevenue')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colMargin')}</th>
            </tr>
          </thead>
          <tbody>
            {isPending && <tr><td colSpan={5} className="px-4 py-8 text-center">{t('common.loading')}</td></tr>}
            {!isPending && rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center">{t('common.noData')}</td></tr>}
            {rows.map((r) => (
              <tr key={r.storeId} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-medium">{r.storeName}</td>
                <td className="px-4 py-3 text-right">{r.receiptCount}</td>
                <td className="px-4 py-3 text-right">{r.netQuantity}</td>
                <td className="px-4 py-3 text-right">{fmtMoney(r.revenue)}</td>
                <td className="px-4 py-3 text-right text-emerald-700">{fmtMoney(r.margin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination page={page} pageSize={pageSize} total={data?.totalElements ?? 0} totalPages={data?.totalPages ?? 0} onPageChange={setPage} onPageSizeChange={setPageSize} />
    </div>
  );
}
