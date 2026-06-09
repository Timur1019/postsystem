import OrdersListHeader from '../components/OrdersListHeader';
import OrdersSearchPanel from '../components/OrdersSearchPanel';
import OrdersTable from '../components/OrdersTable';
import OrdersModals from '../components/OrdersModals';
import { useOrdersListPage } from '../hooks/useOrdersListPage';

export default function OrdersListPage() {
  const p = useOrdersListPage();

  const errorMessage =
    p.error?.response?.data?.message ?? p.error?.message ?? p.t('orders.loadError');

  return (
    <div className="space-y-4">
      <OrdersListHeader
        t={p.t}
        onAdd={() => p.setAddOpen(true)}
        onExport={p.onExport}
      />

      <OrdersSearchPanel
        t={p.t}
        search={p.search}
        onSearchChange={p.setSearch}
        onSearchApply={p.applySearch}
        onOpenFilters={() => p.setFiltersOpen(true)}
      />

      <OrdersTable
        t={p.t}
        rows={p.rows}
        loading={p.loading}
        isError={p.isError}
        errorMessage={errorMessage}
        page={p.page}
        pageSize={p.pageSize}
        total={p.total}
        totalPages={p.totalPages}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
      />

      <OrdersModals
        filtersOpen={p.filtersOpen}
        onFiltersClose={() => p.setFiltersOpen(false)}
        filters={p.filters}
        onFiltersChange={p.setFilters}
        onFiltersApply={p.applyFilters}
        onFiltersReset={p.resetFilters}
        addOpen={p.addOpen}
        onAddClose={() => p.setAddOpen(false)}
        stores={p.stores}
        onOrderCreated={p.onOrderCreated}
      />
    </div>
  );
}
