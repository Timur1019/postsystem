import ProductInfoDetailsBody from './ProductInfoDetailsBody';

export default function ProductInfoModalDetailsTab({ t, isPending, isError, product }) {
  if (isPending) {
    return (
      <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        {t('common.loading')}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
        {t('products.info.loadFail')}
      </div>
    );
  }

  if (!product) return null;

  return <ProductInfoDetailsBody t={t} product={product} />;
}
