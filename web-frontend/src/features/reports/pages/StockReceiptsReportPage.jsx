import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format as fmtDate } from 'date-fns';
import { Plus } from 'lucide-react';
import TablePagination from '../../../components/shared/TablePagination';
import { fmtMoney } from '../../../utils/formatMoney';
import ReportDateBar from '../../../components/shared/ReportDateBar';
import ReportStoreSelect from '../components/ReportStoreSelect';
import { useStockReceiptsReportPage } from '../hooks/useStockReceiptsReportPage';

export default function StockReceiptsReportPage() {
  const { t } = useTranslation();
  const r = useStockReceiptsReportPage();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.receiptsTitle')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.receiptsSubtitle')}</p>
        </div>
        <Link
          to="/stock/receipts/new"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus size={16} />
          {t('stockReports.newReceiptDoc')}
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <ReportDateBar from={r.from} to={r.to} onFrom={r.setFrom} onTo={r.setTo} />
        <ReportStoreSelect stores={r.stores} value={r.storeId} onChange={r.handleStoreChange} />
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase dark:bg-slate-800/80">
            <tr>
              <th className="px-4 py-3">{t('stockReports.colReceiptNo')}</th>
              <th className="px-4 py-3">{t('stockReports.colDate')}</th>
              <th className="px-4 py-3">{t('stockReports.colSupplier')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colQty')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colAmount')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending && <tr><td colSpan={5} className="p-6 text-center">{t('common.loading')}</td></tr>}
            {!r.isPending && r.rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center">{t('common.noData')}</td></tr>}
            {r.rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-2 font-mono text-emerald-800 dark:text-emerald-400">{row.receiptNumber}</td>
                <td className="px-4 py-2">{row.createdAt ? fmtDate(new Date(row.createdAt), 'dd.MM.yyyy HH:mm') : '—'}</td>
                <td className="px-4 py-2">{row.supplierName || '—'}</td>
                <td className="px-4 py-2 text-right">{row.totalQuantity}</td>
                <td className="px-4 py-2 text-right">{fmtMoney(row.totalCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <TablePagination
          page={r.page}
          pageSize={r.pageSize}
          total={r.total}
          totalPages={r.totalPages}
          onPageChange={r.setPage}
          onPageSizeChange={r.setPageSize}
        />
      </div>
    </div>
  );
}
