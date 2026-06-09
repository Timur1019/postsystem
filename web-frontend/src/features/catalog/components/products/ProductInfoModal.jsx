import { lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useProductInfoModal } from '../../hooks/useProductInfoModal';
import ProductInfoModalHeader from './product-info/ProductInfoModalHeader';
import ProductInfoModalTabBar from './product-info/ProductInfoModalTabBar';
import ProductInfoModalFooter from './product-info/ProductInfoModalFooter';
import ProductInfoModalDetailsTab from './product-info/ProductInfoModalDetailsTab';
import LazyModalSuspense from './products-modals/LazyModalSuspense';

const ProductLifecycleSection = lazy(() => import('./ProductLifecycleSection'));

export default function ProductInfoModal({
  open,
  productId,
  initialTab = 'details',
  onClose,
  onEdit,
  onReceive,
  onDelete,
}) {
  const { t } = useTranslation();
  const { tab, setTab, product, isPending, isError } = useProductInfoModal({
    open,
    productId,
    initialTab,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <ProductInfoModalHeader t={t} productName={product?.name} onClose={onClose} />
        <ProductInfoModalTabBar t={t} tab={tab} productId={productId} onTabChange={setTab} />

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {tab === 'details' && (
            <ProductInfoModalDetailsTab
              t={t}
              isPending={isPending}
              isError={isError}
              product={product}
            />
          )}

          <LazyModalSuspense when={tab === 'lifecycle' && !!productId}>
            {tab === 'lifecycle' && productId ? (
              <ProductLifecycleSection productId={productId} />
            ) : null}
          </LazyModalSuspense>
        </div>

        <ProductInfoModalFooter
          t={t}
          product={product}
          onEdit={onEdit}
          onReceive={onReceive}
          onDelete={onDelete}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
