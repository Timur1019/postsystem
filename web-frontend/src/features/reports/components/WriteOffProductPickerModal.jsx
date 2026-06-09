import { useTranslation } from 'react-i18next';

export default function WriteOffProductPickerModal({
  productSearch,
  onSearchChange,
  candidates,
  onSelect,
  onClose,
}) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold">{t('stockReports.pickProduct')}</h2>
        <input
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          placeholder={t('common.search')}
          value={productSearch}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <ul className="mt-3 max-h-48 overflow-y-auto">
          {candidates.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                className="w-full px-2 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => onSelect(product)}
              >
                {product.name} ({product.stockQuantity} {t('stockReports.unitsSuffix')})
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="mt-4 w-full rounded-lg border px-4 py-2 text-sm" onClick={onClose}>
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}
