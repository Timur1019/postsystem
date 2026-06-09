import ProductRowActionsMenu from '../ProductRowActionsMenu';

export default function ProductsRowActionsOverlay({ p }) {
  return (
    <ProductRowActionsMenu
      rowMenu={p.rowMenu}
      manage={p.manage}
      t={p.t}
      onClose={() => p.setRowMenu(null)}
      onOpenInfo={(product) => {
        p.setInfoTab('details');
        p.setInfoProductId(product.id);
        p.setRowMenu(null);
      }}
      onOpenLifecycle={(product) => {
        p.setInfoTab('lifecycle');
        p.setInfoProductId(product.id);
        p.setRowMenu(null);
      }}
      onLifecycleReport={(product) => {
        p.navigate(`/reports/stock/lifecycle?productId=${product.id}`);
        p.setRowMenu(null);
      }}
      onEdit={(product) => {
        p.setEditProduct(product);
        p.setRowMenu(null);
      }}
      onAdjustStock={(product) => {
        p.setStockProduct(product);
        p.setRowMenu(null);
      }}
      onReceive={(product) => {
        p.setReceiveProduct({ id: product.id, name: product.name });
        p.setRowMenu(null);
      }}
      onDelete={(product) => {
        p.setDeleteProduct(product);
        p.setRowMenu(null);
      }}
    />
  );
}
