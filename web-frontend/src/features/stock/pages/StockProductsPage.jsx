import { Filter, Plus } from 'lucide-react';
import {
  BaseButton,
  ErrorBanner,
  PageLayout,
  PageSearchField,
} from '../../../components/ui';
import StockProductsTable from '../components/StockProductsTable';
import StockProductsModals from '../components/StockProductsModals';
import { useStockProductsPage } from '../hooks/useStockProductsPage';

export default function StockProductsPage() {
  const p = useStockProductsPage();

  return (
    <PageLayout
      title={p.t('stockModule.title')}
      actions={(
        <>
          {p.manage && (
            <BaseButton variant="secondary" onClick={() => p.setReceiveOpen(true)}>
              <Plus size={16} />
              {p.t('stockModule.add')}
            </BaseButton>
          )}
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
          placeholder={p.t('stockModule.searchPh')}
        />
      )}
    >
      {p.isError && <ErrorBanner message={p.errorMessage} />}

      <StockProductsTable
        t={p.t}
        rows={p.rows}
        loading={p.loading}
        showEmptyHint={p.showEmptyHint}
        displayBarcode={p.displayBarcode}
        onOpenRowMenu={p.openRowMenu}
        page={p.page}
        pageSize={p.pageSize}
        total={p.total}
        totalPages={p.totalPages}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
      />

      <StockProductsModals
        t={p.t}
        manage={p.manage}
        filtersOpen={p.filtersOpen}
        onFiltersClose={() => p.setFiltersOpen(false)}
        filters={p.filters}
        onFiltersChange={p.setFilters}
        onFiltersReset={p.resetFilters}
        onFiltersApply={p.applyFilters}
        receiveOpen={p.receiveOpen}
        onReceiveClose={() => p.setReceiveOpen(false)}
        onInvalidateCaches={p.invalidateCaches}
        editProduct={p.editProduct}
        onEditClose={() => p.setEditProduct(null)}
        categories={p.categories}
        stores={p.stores}
        stockProduct={p.stockProduct}
        onStockClose={() => p.setStockProduct(null)}
        receiveProduct={p.receiveProduct}
        onReceiveProductClose={() => p.setReceiveProduct(null)}
        infoProductId={p.infoProductId}
        onInfoClose={() => p.setInfoProductId(null)}
        onInfoEdit={(prod) => {
          if (!prod) return;
          p.setInfoProductId(null);
          p.setEditProduct(prod);
        }}
        onInfoReceive={(prod) => {
          if (!prod) return;
          p.setInfoProductId(null);
          p.setReceiveProduct({ id: prod.id, name: prod.name });
        }}
        onInfoDelete={(prod) => {
          if (!prod) return;
          p.setInfoProductId(null);
          p.setDeleteProduct(prod);
        }}
        deleteProduct={p.deleteProduct}
        onDeleteClose={() => p.setDeleteProduct(null)}
        onDeleteConfirm={p.confirmDelete}
        rowMenu={p.rowMenu}
        onRowMenuClose={p.closeRowMenu}
        onInfo={p.setInfoProductId}
        onEdit={p.setEditProduct}
        onAdjust={p.setStockProduct}
        onReceive={p.setReceiveProduct}
        onDelete={p.setDeleteProduct}
      />
    </PageLayout>
  );
}
