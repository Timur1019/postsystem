import { StockAdjustModal, WarehouseReceiveModal } from '../../../../../components/product-stock';

export default function ProductsStockModals({ p }) {
  return (
    <>
      {p.stockProduct && (
        <StockAdjustModal
          product={p.stockProduct}
          onClose={() => p.setStockProduct(null)}
          onSaved={() => {
            p.invalidateProducts();
            p.setStockProduct(null);
          }}
        />
      )}

      <WarehouseReceiveModal
        open={!!p.receiveProduct}
        onClose={() => p.setReceiveProduct(null)}
        initialProduct={p.receiveProduct}
        onSaved={p.invalidateProducts}
      />
    </>
  );
}
