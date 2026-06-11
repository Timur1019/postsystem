import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format as fmtDate } from 'date-fns';
import { Plus } from 'lucide-react';
import { stockReportApi } from '../../../api';
import { BaseSelect } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import ReportDateBar from '../../../components/shared/ReportDateBar';
import ReportExportButton from '../components/ReportExportButton';
import { useStockTransfersReportPage } from '../hooks/useStockTransfersReportPage';

export default function StockTransfersReportPage() {
  const { t } = useTranslation();
  const r = useStockTransfersReportPage();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.transfersTitle')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.transfersSubtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReportExportButton
            fetchBlob={() => stockReportApi.exportTransfers(r.exportParams)}
            filenamePrefix="stock_transfers"
            disabled={!r.from || !r.to}
          />
          <Link to="/stock/transfers/new" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            <Plus size={16} />
            {t('stockReports.newTransferDoc')}
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <ReportDateBar from={r.from} to={r.to} onFrom={r.setFrom} onTo={r.setTo} />
        <BaseSelect
          value={r.fromStoreId}
          onChange={(e) => r.handleFromStoreChange(e.target.value)}
          placeholder={t('stockReports.fromStore')}
          options={[
            { value: '', label: t('stockReports.fromStore') },
            ...r.stores.map((s) => ({ value: String(s.id), label: s.name })),
          ]}
        />
        <BaseSelect
          value={r.toStoreId}
          onChange={(e) => r.handleToStoreChange(e.target.value)}
          placeholder={t('stockReports.toStore')}
          options={[
            { value: '', label: t('stockReports.toStore') },
            ...r.stores.map((s) => ({ value: String(s.id), label: s.name })),
          ]}
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase dark:bg-slate-800/80">
            <tr>
              <th className="px-4 py-3">{t('stockReports.colTransferNo')}</th>
              <th className="px-4 py-3">{t('stockReports.colDate')}</th>
              <th className="px-4 py-3">{t('stockReports.colRoute')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colQty')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending && <tr><td colSpan={4} className="p-6 text-center">{t('common.loading')}</td></tr>}
            {!r.isPending && r.rows.length === 0 && <tr><td colSpan={4} className="p-6 text-center">{t('common.noData')}</td></tr>}
            {r.rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-medium">{row.transferNumber}</td>
                <td className="px-4 py-3">{fmtDate(new Date(row.createdAt), 'dd.MM.yyyy HH:mm')}</td>
                <td className="px-4 py-3">{row.fromStoreName} → {row.toStoreName}</td>
                <td className="px-4 py-3 text-right">{row.totalQuantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination page={r.page} pageSize={r.pageSize} total={r.total} totalPages={r.totalPages} onPageChange={r.setPage} onPageSizeChange={r.setPageSize} />
    </div>
  );
}
