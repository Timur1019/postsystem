import ProductsCatalogModals from './products-modals/ProductsCatalogModals';
import ProductsStockModals from './products-modals/ProductsStockModals';
import ProductsBulkModals from './products-modals/ProductsBulkModals';
import ProductsImportExportModals from './products-modals/ProductsImportExportModals';
import ProductsInfoModals from './products-modals/ProductsInfoModals';
import ProductsRowActionsOverlay from './products-modals/ProductsRowActionsOverlay';

export default function ProductsModals({ p }) {
  return (
    <>
      <ProductsCatalogModals p={p} />
      <ProductsStockModals p={p} />
      <ProductsImportExportModals p={p} />
      <ProductsBulkModals p={p} />
      <ProductsInfoModals p={p} />
      <ProductsRowActionsOverlay p={p} />
    </>
  );
}
