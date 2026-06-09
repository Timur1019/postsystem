import { useTranslation } from 'react-i18next';
import { reportApi } from '../../../api';
import TablePagination from '../../../components/shared/TablePagination';
import { fmtMoney } from '../../../utils/formatMoney';
import ReportDataTable from '../components/ReportDataTable';
import ReportDateBar from '../../../components/shared/ReportDateBar';
import ReportExportButton from '../components/ReportExportButton';
import ReportStoreSelect from '../components/ReportStoreSelect';
import { useCategorySalesReportPage } from '../hooks/useCategorySalesReportPage';

export default function CategorySalesReportPage() {
  const { t } = useTranslation();
  const r = useCategorySalesReportPage();

  const columns = [
    { key: 'category', label: t('stockReports.colCategory') },
    { key: 'receipts', label: t('stockReports.colReceipts'), align: 'right' },
    { key: 'net', label: t('stockReports.colNet'), align: 'right' },
    { key: 'revenue', label: t('stockReports.colRevenue'), align: 'right' },
    { key: 'margin', label: t('stockReports.colMargin'), align: 'right' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.salesByCategoriesTitle')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.salesByCategoriesSubtitle')}</p>
        </div>
        <ReportExportButton
          fetchBlob={() => reportApi.exportSalesByCategories(r.exportParams)}
          filenamePrefix="sales_by_categories"
          disabled={!r.rangeEnabled}
        />
      </div>
      <ReportDateBar from={r.from} to={r.to} onFrom={r.setFrom} onTo={r.setTo} />
      <ReportStoreSelect stores={r.stores} value={r.storeId} onChange={r.handleStoreChange} />
      <ReportDataTable
        rows={r.rows}
        isPending={r.isPending}
        isError={r.isError}
        error={r.error}
        t={t}
        columns={columns}
        renderRow={(row) => (
          <tr key={row.categoryId ?? 'none'} className="border-b border-slate-100 dark:border-slate-800">
            <td className="px-4 py-3 font-medium">{row.categoryName || t('stockReports.uncategorized')}</td>
            <td className="px-4 py-3 text-right">{row.receiptCount}</td>
            <td className="px-4 py-3 text-right">{row.netQuantity}</td>
            <td className="px-4 py-3 text-right">{fmtMoney(row.revenue)}</td>
            <td className="px-4 py-3 text-right text-emerald-700">{fmtMoney(row.margin)}</td>
          </tr>
        )}
      />
      <TablePagination
        page={r.page}
        pageSize={r.pageSize}
        total={r.total}
        totalPages={r.totalPages}
        onPageChange={r.setPage}
        onPageSizeChange={r.setPageSize}
      />
    </div>
  );
}
