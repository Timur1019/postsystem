import { ProductCatalogModal, ProductInfoModal } from '../../catalog';
import { StockAdjustModal, WarehouseReceiveModal } from '../../../components/product-stock';
import StockProductDeleteModal from './StockProductDeleteModal';
import StockProductsFiltersDrawer from './StockProductsFiltersDrawer';
import StockProductsRowMenu from './StockProductsRowMenu';

export default function StockProductsModals({
  t,
  manage,
  filtersOpen,
  onFiltersClose,
  filters,
  onFiltersChange,
  onFiltersReset,
  onFiltersApply,
  receiveOpen,
  onReceiveClose,
  onInvalidateCaches,
  editProduct,
  onEditClose,
  categories,
  stores,
  stockProduct,
  onStockClose,
  receiveProduct,
  onReceiveProductClose,
  infoProductId,
  onInfoClose,
  onInfoEdit,
  onInfoReceive,
  onInfoDelete,
  deleteProduct,
  onDeleteClose,
  onDeleteConfirm,
  rowMenu,
  onRowMenuClose,
  onInfo,
  onEdit,
  onAdjust,
  onReceive,
  onDelete,
}) {
  return (
    <>
      <StockProductsFiltersDrawer
        open={filtersOpen}
        onClose={onFiltersClose}
        filters={filters}
        onChange={onFiltersChange}
        onReset={onFiltersReset}
        onApply={onFiltersApply}
      />

      <WarehouseReceiveModal
        open={receiveOpen}
        onClose={onReceiveClose}
        onSaved={onInvalidateCaches}
      />

      {editProduct && (
        <ProductCatalogModal
          key={editProduct.id}
          product={editProduct}
          categories={categories}
          stores={stores}
          onClose={onEditClose}
          onSaved={() => {
            onInvalidateCaches();
            onEditClose();
          }}
        />
      )}

      {stockProduct && (
        <StockAdjustModal
          product={stockProduct}
          onClose={onStockClose}
          onSaved={() => {
            onInvalidateCaches();
            onStockClose();
          }}
        />
      )}

      <WarehouseReceiveModal
        open={!!receiveProduct}
        onClose={onReceiveProductClose}
        initialProduct={receiveProduct}
        onSaved={onInvalidateCaches}
      />

      <ProductInfoModal
        open={!!infoProductId}
        productId={infoProductId}
        onClose={onInfoClose}
        onEdit={onInfoEdit}
        onReceive={onInfoReceive}
        onDelete={onInfoDelete}
      />

      <StockProductDeleteModal
        t={t}
        product={deleteProduct}
        onClose={onDeleteClose}
        onConfirm={onDeleteConfirm}
      />

      <StockProductsRowMenu
        menu={rowMenu}
        t={t}
        manage={manage}
        onClose={onRowMenuClose}
        onInfo={onInfo}
        onEdit={onEdit}
        onAdjust={onAdjust}
        onReceive={onReceive}
        onDelete={onDelete}
      />
    </>
  );
}
