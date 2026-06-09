import ProductsToolbar from '../components/products/ProductsToolbar';
import ProductsTable from '../components/products/ProductsTable';
import ProductsModals from '../components/products/ProductsModals';
import ProductsSearchField from '../components/products/ProductsSearchField';
import { useProductsPage } from '../hooks/useProductsPage';

export default function ProductsPage() {
  const p = useProductsPage();

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{p.t('products.title')}</h1>
        </div>
        <ProductsToolbar
          canManage={p.manage}
          onAdd={p.handleAddProduct}
          onImport={() => p.setImportOpen(true)}
          onExport={() => p.setExportOpen(true)}
          onBulkVat={p.openBulkVat}
          onDeleteAll={p.openBulkDelete}
          onOpenFilters={() => p.setFiltersOpen(true)}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <ProductsSearchField
          value={p.search}
          onChange={p.handleSearchChange}
          placeholder={p.t('products.searchNamePh')}
        />
      </div>

      <ProductsTable
        t={p.t}
        isLoading={p.isLoading}
        data={p.data}
        page={p.page}
        pageSize={p.pageSize}
        total={p.total}
        totalPages={p.totalPages}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
        selectedIds={p.selectedIds}
        toggleSelect={p.toggleSelect}
        allPageSelected={p.allPageSelected}
        somePageSelected={p.somePageSelected}
        toggleSelectAllPage={p.toggleSelectAllPage}
        selectAllRef={p.selectAllRef}
        onOpenRowMenu={(product, rect) =>
          p.setRowMenu((cur) => (cur?.product?.id === product.id ? null : { product, rect }))
        }
      />

      <ProductsModals p={p} />
    </div>
  );
}
