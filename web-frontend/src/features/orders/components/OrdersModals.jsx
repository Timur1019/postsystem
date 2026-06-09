import OrdersFiltersDrawer from './OrdersFiltersDrawer';
import OrderAddWizard from './OrderAddWizard';

export default function OrdersModals({
  filtersOpen,
  onFiltersClose,
  filters,
  onFiltersChange,
  onFiltersApply,
  onFiltersReset,
  addOpen,
  onAddClose,
  stores,
  onOrderCreated,
}) {
  return (
    <>
      <OrdersFiltersDrawer
        open={filtersOpen}
        onClose={onFiltersClose}
        filters={filters}
        onChange={onFiltersChange}
        onApply={onFiltersApply}
        onReset={onFiltersReset}
      />

      <OrderAddWizard
        open={addOpen}
        onClose={onAddClose}
        stores={stores}
        onCreated={onOrderCreated}
      />
    </>
  );
}
