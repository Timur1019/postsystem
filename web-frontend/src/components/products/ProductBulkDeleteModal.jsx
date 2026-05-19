import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../services/api';
import { invalidateProductCaches } from '../../utils/productCache';

export default function ProductBulkDeleteModal({ productIds, onClose, onDone }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const count = productIds.size;

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      productApi.bulkDeactivate({
        productIds: [...productIds],
      }),
    onSuccess: () => {
      toast.success(t('products.bulkDelete.success', { count }));
      invalidateProductCaches(qc);
      onDone?.();
    },
    onError: (err) => toast.error(err.response?.data?.message ?? t('products.bulkDelete.failed')),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <h2 className="text-lg font-bold">{t('products.bulkDelete.title')}</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-2">
          <p className="text-sm text-slate-700 dark:text-slate-200">{t('products.bulkDelete.hint', { count })}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('products.bulkDelete.note')}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => mutate()}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isPending && <Loader size={14} className="animate-spin" />}
            {t('products.bulkDelete.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
