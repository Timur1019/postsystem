import { BaseButton } from '../../../components/ui';

export default function StockProductDeleteModal({ t, product, onClose, onConfirm }) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('products.delete.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <div className="px-4 py-4 text-sm text-slate-700 dark:text-slate-200">
          {t('products.delete.hint', { name: product.name })}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
          <BaseButton variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </BaseButton>
          <BaseButton className="bg-red-600 hover:bg-red-700 dark:bg-red-600" onClick={onConfirm}>
            {t('products.rowDelete')}
          </BaseButton>
        </div>
      </div>
    </div>
  );
}
