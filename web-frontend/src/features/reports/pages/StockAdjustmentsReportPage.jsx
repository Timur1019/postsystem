import { useTranslation } from 'react-i18next';
import { format as fmtDate } from 'date-fns';
import { stockReportApi } from '../../../api';
import TablePagination from '../../../components/shared/TablePagination';
import ReportDateBar from '../../../components/shared/ReportDateBar';
import ReportExportButton from '../components/ReportExportButton';
import ReportStoreSelect from '../components/ReportStoreSelect';
import { useStockAdjustmentsReportPage } from '../hooks/useStockAdjustmentsReportPage';

export default function StockAdjustmentsReportPage() {
  const { t } = useTranslation();
  const r = useStockAdjustmentsReportPage();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.adjustmentsTitle')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.adjustmentsSubtitle')}</p>
        </div>
        <ReportExportButton
          fetchBlob={() => stockReportApi.exportAdjustments(r.exportParams)}
          filenamePrefix="stock_adjustments"
          disabled={!r.from || !r.to}
        />
      </div>
      <ReportDateBar from={r.from} to={r.to} onFrom={r.setFrom} onTo={r.setTo} />
      <div className="flex flex-wrap gap-3">
        <input
          value={r.search}
          onChange={(e) => r.handleSearchChange(e.target.value)}
          placeholder={t('common.search')}
          className="min-w-[10rem] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <ReportStoreSelect stores={r.stores} value={r.storeId} onChange={r.handleStoreChange} />
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
            {r.isPending && <tr><td colSpan={5} className="px-4 py-8 text-center">{t('common.loading')}</td></tr>}
            {!r.isPending && r.rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center">{t('common.noData')}</td></tr>}
            {r.rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3">{fmtDate(new Date(row.createdAt), 'dd.MM.yyyy HH:mm')}</td>
                <td className="px-4 py-3">{row.productName}</td>
                <td className={`px-4 py-3 text-right font-medium ${row.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {row.quantity > 0 ? '+' : ''}{row.quantity}
                </td>
                <td className="px-4 py-3">{row.storeName ?? '—'}</td>
                <td className="px-4 py-3">{row.createdByName ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination page={r.page} pageSize={r.pageSize} total={r.total} totalPages={r.totalPages} onPageChange={r.setPage} onPageSizeChange={r.setPageSize} />
    </div>
  );
}
