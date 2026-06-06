import toast from 'react-hot-toast';
import { productApi } from '../../services/api';

export default function ProductDeleteConfirmModal({ product, t, onClose, onDeleted }) {
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
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await productApi.deactivate(product.id);
                toast.success(t('products.deactivated'));
                onDeleted();
              } catch (e) {
                toast.error(e?.response?.data?.message ?? t('productModal.saveFailed'));
              }
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            {t('products.rowDelete')}
          </button>
        </div>
      </div>
    </div>
  );
}
