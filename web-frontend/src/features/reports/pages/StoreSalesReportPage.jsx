import { useTranslation } from 'react-i18next';
import { reportApi } from '../../../api';
import TablePagination from '../../../components/shared/TablePagination';
import { fmtMoney } from '../../../utils/formatMoney';
import ReportDateBar from '../../../components/shared/ReportDateBar';
import ReportExportButton from '../components/ReportExportButton';
import { useStoreSalesReportPage } from '../hooks/useStoreSalesReportPage';

export default function StoreSalesReportPage() {
  const { t } = useTranslation();
  const r = useStoreSalesReportPage();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.salesByStoresTitle')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.salesByStoresSubtitle')}</p>
        </div>
        <ReportExportButton
          fetchBlob={() => reportApi.exportSalesByStores(r.exportParams)}
          filenamePrefix="sales_by_stores"
          disabled={!r.rangeEnabled}
        />
      </div>
      <ReportDateBar from={r.from} to={r.to} onFrom={r.setFrom} onTo={r.setTo} />
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
            {r.isPending && <tr><td colSpan={5} className="px-4 py-8 text-center">{t('common.loading')}</td></tr>}
            {!r.isPending && r.rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center">{t('common.noData')}</td></tr>}
            {r.rows.map((row) => (
              <tr key={row.storeId} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-medium">{row.storeName}</td>
                <td className="px-4 py-3 text-right">{row.receiptCount}</td>
                <td className="px-4 py-3 text-right">{row.netQuantity}</td>
                <td className="px-4 py-3 text-right">{fmtMoney(row.revenue)}</td>
                <td className="px-4 py-3 text-right text-emerald-700">{fmtMoney(row.margin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination page={r.page} pageSize={r.pageSize} total={r.total} totalPages={r.totalPages} onPageChange={r.setPage} onPageSizeChange={r.setPageSize} />
    </div>
  );
}
