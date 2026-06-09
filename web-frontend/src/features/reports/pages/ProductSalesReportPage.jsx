import { useTranslation } from 'react-i18next';
import { reportApi } from '../../../api/report.api';
import ReportExportButton from '../components/ReportExportButton';
import ReportPageLayout from '../components/ReportPageLayout';
import ProductSalesReportFilters from '../components/product-sales/ProductSalesReportFilters';
import ProductSalesReportTable from '../components/product-sales/ProductSalesReportTable';
import { useProductSalesReportPage } from '../hooks/useProductSalesReportPage';

export default function ProductSalesReportPage() {
  const { t } = useTranslation();
  const r = useProductSalesReportPage();

  return (
    <ReportPageLayout
      title={t('stockReports.salesByProductsTitle')}
      subtitle={t('stockReports.salesByProductsSubtitle')}
      actions={(
        <ReportExportButton
          fetchBlob={() => reportApi.exportSalesByProducts(r.exportParams)}
          filenamePrefix="sales_by_products"
          disabled={!r.rangeEnabled}
        />
      )}
      filters={(
        <ProductSalesReportFilters
          t={t}
          from={r.from}
          to={r.to}
          onFrom={r.setFrom}
          onTo={r.setTo}
          search={r.search}
          onSearchChange={r.handleSearchChange}
          stores={r.stores}
          storeId={r.storeId}
          onStoreChange={r.handleStoreChange}
          categoryId={r.categoryId}
          onCategoryChange={r.handleCategoryChange}
          categories={r.categories}
        />
      )}
    >
      <ProductSalesReportTable
        t={t}
        rows={r.rows}
        isPending={r.isPending}
        isError={r.isError}
        error={r.error}
        page={r.page}
        pageSize={r.pageSize}
        total={r.total}
        totalPages={r.totalPages}
        onPageChange={r.setPage}
        onPageSizeChange={r.setPageSize}
      />
    </ReportPageLayout>
  );
}
