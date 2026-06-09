import { lazy } from 'react';
import ProductFiltersDrawer from '../ProductFiltersDrawer';
import LazyModalSuspense from './LazyModalSuspense';

const ProductImportModal = lazy(() => import('../ProductImportModal'));
const ProductExportModal = lazy(() => import('../ProductExportModal'));

export default function ProductsImportExportModals({ p }) {
  return (
    <>
      <ProductFiltersDrawer
        open={p.filtersOpen}
        onClose={() => p.setFiltersOpen(false)}
        filters={p.filters}
        onChange={p.setFilters}
        categories={p.categories}
        stores={p.stores}
        onReset={p.resetFilters}
        onApply={p.applyFilters}
      />

      <LazyModalSuspense when={p.importOpen}>
        {p.importOpen ? (
          <ProductImportModal
            categories={p.categories}
            stores={p.stores}
            onClose={() => {
              p.setImportOpen(false);
              p.invalidateProducts();
            }}
          />
        ) : null}
      </LazyModalSuspense>

      <LazyModalSuspense when={p.exportOpen}>
        {p.exportOpen ? (
          <ProductExportModal stores={p.stores} onClose={() => p.setExportOpen(false)} />
        ) : null}
      </LazyModalSuspense>
    </>
  );
}
