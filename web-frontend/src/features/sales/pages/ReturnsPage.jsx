import { Filter, Download, RotateCcw } from 'lucide-react';
import {
  BaseButton,
  ErrorBanner,
  PageLayout,
  PageSearchField,
} from '../../../components/ui';
import ReturnsTable from '../components/returns/ReturnsTable';
import ReturnsModals from '../components/returns/ReturnsModals';
import { useReturnsPage } from '../hooks/useReturnsPage';

export default function ReturnsPage() {
  const p = useReturnsPage();

  return (
    <PageLayout
      title={p.t('returnsModule.title')}
      actions={(
        <>
          <BaseButton onClick={() => p.setCreateReturnOpen(true)}>
            <RotateCcw size={16} />
            {p.t('returnsModule.createReturn')}
          </BaseButton>
          <BaseButton
            variant="secondary"
            onClick={p.handleExportExcel}
            disabled={p.exporting}
          >
            <Download size={16} />
            {p.exporting ? p.t('returnsModule.exporting') : p.t('returnsModule.downloadExcel')}
          </BaseButton>
        </>
      )}
      filters={(
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <PageSearchField
            className="flex-1"
            value={p.search}
            onChange={p.handleSearchChange}
            placeholder={p.t('returnsModule.searchPh')}
          />
          <BaseButton onClick={() => p.setFiltersOpen(true)} className="shrink-0">
            <Filter size={16} />
            {p.t('products.toolbar.filters')}
          </BaseButton>
        </div>
      )}
    >
      {p.isError && <ErrorBanner message={p.errorMessage} />}

      <ReturnsTable
        t={p.t}
        rows={p.rows}
        loading={p.loading}
        showEmptyHint={p.showEmptyHint}
        fmtAt={p.fmtAt}
        menuOpenId={p.menuOpenId}
        onMenuOpenChange={p.setMenuOpenId}
        onOpenDetail={p.openDetail}
        onEditReason={p.setEditRow}
        onContinueReturn={p.startContinueReturn}
        onCancelReturn={p.tryCancelReturn}
        page={p.page}
        pageSize={p.pageSize}
        total={p.total}
        totalPages={p.totalPages}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
      />

      <ReturnsModals
        filtersOpen={p.filtersOpen}
        onFiltersClose={() => p.setFiltersOpen(false)}
        filters={p.filters}
        onFiltersChange={p.setFilters}
        stores={p.stores}
        onFiltersReset={p.resetFilters}
        onFiltersApply={p.applyFilters}
        detailId={p.detailId}
        detailReason={p.detailReason}
        onDetailClose={p.closeDetail}
        editRow={p.editRow}
        updateReasonSaving={p.updateReasonSaving}
        onEditClose={() => p.setEditRow(null)}
        onSaveReason={p.saveReason}
        createReturnOpen={p.createReturnOpen}
        onCreateReturnClose={() => p.setCreateReturnOpen(false)}
        onReturnSuccess={p.invalidateReturnQueries}
        continueReturnSaleId={p.continueReturnSaleId}
        onContinueReturnClose={() => p.setContinueReturnSaleId(null)}
      />
    </PageLayout>
  );
}
