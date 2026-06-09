import { lazy } from 'react';
import ProductDeleteConfirmModal from '../ProductDeleteConfirmModal';
import LazyModalSuspense from './LazyModalSuspense';

const ProductInfoModal = lazy(() => import('../ProductInfoModal'));

export default function ProductsInfoModals({ p }) {
  return (
    <>
      <LazyModalSuspense when={!!p.infoProductId}>
        {p.infoProductId ? (
          <ProductInfoModal
            open
            productId={p.infoProductId}
            initialTab={p.infoTab}
            onClose={() => p.setInfoProductId(null)}
            onEdit={(product) => {
              if (!product) return;
              p.setInfoProductId(null);
              p.setEditProduct(product);
            }}
            onReceive={(product) => {
              if (!product) return;
              p.setInfoProductId(null);
              p.setReceiveProduct({ id: product.id, name: product.name });
            }}
            onDelete={(product) => {
              if (!product) return;
              p.setInfoProductId(null);
              p.setDeleteProduct(product);
            }}
          />
        ) : null}
      </LazyModalSuspense>

      <ProductDeleteConfirmModal
        product={p.deleteProduct}
        t={p.t}
        onClose={() => p.setDeleteProduct(null)}
        onDeleted={() => {
          p.invalidateProducts();
          p.setDeleteProduct(null);
        }}
      />
    </>
  );
}
