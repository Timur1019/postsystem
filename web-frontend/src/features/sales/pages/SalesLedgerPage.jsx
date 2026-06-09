import { Download, Filter, RotateCcw } from 'lucide-react';
import {
  BaseButton,
  ErrorBanner,
  PageLayout,
  PageSearchField,
} from '../../../components/ui';
import SalesLedgerTable from '../components/sales-ledger/SalesLedgerTable';
import SalesLedgerModals from '../components/sales-ledger/SalesLedgerModals';
import { useSalesLedgerPage } from '../hooks/useSalesLedgerPage';

export default function SalesLedgerPage() {
  const p = useSalesLedgerPage();

  return (
    <PageLayout
      title={p.t('salesLedger.title')}
      actions={(
        <>
          <BaseButton onClick={() => p.setCreateReturnOpen(true)}>
            <RotateCcw size={16} />
            {p.t('returnsModule.createReturn')}
          </BaseButton>
          <BaseButton variant="secondary" onClick={p.handleExportSalesExcel}>
            <Download size={16} />
            {p.t('salesLedger.export')}
          </BaseButton>
          <BaseButton onClick={() => p.setFiltersOpen(true)}>
            <Filter size={16} />
            {p.t('products.toolbar.filters')}
          </BaseButton>
        </>
      )}
      filters={(
        <PageSearchField
          value={p.search}
          onChange={p.handleSearchChange}
          placeholder={p.t('salesLedger.searchPh')}
        />
      )}
    >
      {p.isError && <ErrorBanner message={p.errorMessage} />}

      <SalesLedgerTable
        t={p.t}
        rows={p.rows}
        loading={p.loading}
        page={p.page}
        pageSize={p.pageSize}
        total={p.total}
        totalPages={p.totalPages}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
        selectedIds={p.selectedIds}
        toggleSelect={p.toggleSelect}
        allPageSelected={p.allPageSelected}
        selectAllRef={p.selectAllRef}
        toggleSelectAllPage={p.toggleSelectAllPage}
        fmtAt={p.fmtAt}
        paymentIconMethod={p.paymentIconMethod}
        paymentLabel={p.paymentLabel}
        onOpenRowMenu={p.openRowMenu}
      />

      <SalesLedgerModals
        t={p.t}
        filtersOpen={p.filtersOpen}
        onFiltersClose={() => p.setFiltersOpen(false)}
        filters={p.filters}
        onFiltersChange={p.setFilters}
        stores={p.stores}
        onFiltersReset={p.resetFilters}
        onFiltersApply={p.applyFilters}
        rowMenu={p.rowMenu}
        onRowMenuClose={p.closeRowMenu}
        onPrint={p.setPrintSaleId}
        onReturn={p.setReturnSaleId}
        printSaleId={p.printSaleId}
        onPrintClose={() => p.setPrintSaleId(null)}
        createReturnOpen={p.createReturnOpen}
        onCreateReturnClose={() => p.setCreateReturnOpen(false)}
        onReturnSuccess={p.invalidateSalesQueries}
        returnSaleId={p.returnSaleId}
        onReturnSaleClose={() => p.setReturnSaleId(null)}
      />
    </PageLayout>
  );
}
