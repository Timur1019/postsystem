export default function ProductInfoIdentifiersCard({ t, product }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="text-sm text-slate-500 dark:text-slate-400">{t('productCatalog.externalId')}:</div>
      <div className="font-mono text-sm text-slate-900 dark:text-slate-100">{product.id}</div>
      <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t('productCatalog.ikpu')}:</div>
      <div className="font-mono text-sm text-slate-900 dark:text-slate-100">{product.ikpu || '—'}</div>
      {product.storageLocation && (
        <>
          <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t('stockModule.modal.location')}:</div>
          <div className="text-sm text-slate-900 dark:text-slate-100">{product.storageLocation}</div>
        </>
      )}
    </div>
  );
}
