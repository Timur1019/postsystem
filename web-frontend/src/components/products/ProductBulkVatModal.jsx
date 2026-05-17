// src/components/products/ProductBulkVatModal.jsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../services/api';
import { invalidateProductCaches } from '../../utils/productCache';

export default function ProductBulkVatModal({ productIds, onClose, onDone }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [taxRate, setTaxRate] = useState('');
  const [error, setError] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const n = Number(String(taxRate).replace(',', '.'));
      return productApi.bulkTaxRate({
        productIds: [...productIds],
        taxRate: n,
      });
    },
    onSuccess: () => {
      toast.success(t('products.bulkVat.success'));
      invalidateProductCaches(qc);
      onDone?.();
    },
    onError: (err) => toast.error(err.response?.data?.message ?? t('products.bulkVat.failed')),
  });

  const submit = () => {
    const n = Number(String(taxRate).replace(',', '.'));
    if (taxRate === '' || !Number.isFinite(n) || n < 0 || n > 100) {
      setError(t('validation.required'));
      return;
    }
    setError('');
    mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <h2 className="text-lg font-bold">{t('products.bulkVat.title')}</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t('products.bulkVat.hint', { count: productIds.size })}
          </p>
          <div>
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">{t('products.bulkVat.field')}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={taxRate}
              onChange={(e) => {
                setTaxRate(e.target.value);
                setError('');
              }}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 dark:bg-slate-800 dark:text-white ${
                error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
              }`}
            />
            {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={isPending || productIds.size === 0}
            onClick={submit}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-50"
          >
            {isPending ? t('common.loading') : t('products.bulkVat.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
