import { useTranslation } from 'react-i18next';
import { ProductLookupSelect } from '../../../components/product-lookup';

export default function WriteOffProductPickerModal({ storeId, onSelect, onClose }) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold">{t('stockReports.pickProduct')}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t('stockReports.lifecycleSearchPlaceholder')}
        </p>
        <div className="mt-3">
          <ProductLookupSelect
            storeId={storeId ?? undefined}
            placeholder={t('stockReports.pickProduct')}
            onProductSelect={onSelect}
          />
        </div>
        <button type="button" className="mt-4 w-full rounded-lg border px-4 py-2 text-sm" onClick={onClose}>
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}
