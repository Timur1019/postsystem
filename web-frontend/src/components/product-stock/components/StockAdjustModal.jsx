// src/components/products/StockAdjustModal.jsx
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../../api';
import { invalidateProductCaches } from '../../../utils/productCache';
import { useCompanyStores } from '../../../hooks/useCompanyStores';
import { getUnitConfig } from '../../../utils/unitConfig';
import { BaseSelect } from '../../../components/ui';
import UnitConversionHelper from '../../../components/shared/UnitConversionHelper';

const inputCls = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm
                  placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500
                  dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500`;

export default function StockAdjustModal({ product, onClose, onSaved }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { stores, onlyStore, needsStorePick, resolveStoreId } = useCompanyStores();
  const [storeId, setStoreId] = useState('');

  useEffect(() => {
    if (onlyStore) setStoreId(String(onlyStore.id));
  }, [onlyStore]);

  const effectiveStoreId = resolveStoreId(storeId);

  const { data: productAtStore } = useQuery({
    queryKey: ['product-stock', product.id, effectiveStoreId],
    queryFn: () => productApi.getById(product.id, { storeId: effectiveStoreId }).then((r) => r.data),
    enabled: !!effectiveStoreId,
  });

  const displayQty = productAtStore?.stockQuantity ?? product.stockQuantity;
  const unitCode = productAtStore?.unitCode ?? product.unitCode ?? 'PCS';
  const saleType = productAtStore?.saleType ?? product.saleType ?? 'PIECE';
  const unitConfig = getUnitConfig(unitCode);
  const constructionLength = productAtStore?.constructionDetails?.standardLength
    ?? product.constructionDetails?.standardLength;

  const schema = useMemo(
    () =>
      z.object({
        quantity: z.coerce.number().refine((n) => n !== 0, t('validation.nonZeroQty')),
        movementType: z.enum(['RESTOCK', 'ADJUSTMENT', 'RETURN']),
        notes: z.string().optional(),
      }),
    [t]
  );

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      quantity: 0,
      movementType: 'ADJUSTMENT',
      notes: '',
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: ({ quantity, movementType, notes }) => {
      const sid = resolveStoreId(storeId);
      if (!sid) {
        return Promise.reject(new Error(t('stockModal.storeRequired')));
      }
      return productApi.adjustStock(product.id, quantity, movementType, notes || undefined, sid);
    },
    onSuccess: () => {
      toast.success(t('stockModal.stockUpdated'));
      invalidateProductCaches(qc);
      onSaved?.();
    },
    onError: (err) => toast.error(err.response?.data?.message ?? err.message ?? t('stockModal.adjustFailed')),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('stockModal.title')}</h2>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{product.name}</p>
            <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-500">
              {t('stockModal.current', { qty: displayQty })}
              {needsStorePick && effectiveStoreId ? ` · ${stores.find((s) => s.id === effectiveStoreId)?.name ?? ''}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4 p-5">
          {needsStorePick ? (
            <BaseSelect
              label={t('stockReports.colStore')}
              required
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              placeholder={t('stockModal.pickStore')}
              options={[
                { value: '', label: t('stockModal.pickStore') },
                ...stores.map((s) => ({ value: String(s.id), label: s.name })),
              ]}
            />
          ) : null}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('stockModal.qtyChange')}
            </label>
            <input
              type="number"
              step={unitConfig.step}
              className={inputCls}
              placeholder={t('stockModal.qtyPh')}
              {...register('quantity')}
            />
            {errors.quantity && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.quantity.message}</p>}
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
              {t('stockModal.qtyHint')} ({unitConfig.label})
            </p>
            <UnitConversionHelper
              t={t}
              stockUnitCode={unitCode}
              standardLength={constructionLength}
              onApplyStockQty={(qty) => setValue('quantity', qty, { shouldValidate: true })}
            />
          </div>

          <BaseSelect
            label={t('stockModal.movement')}
            {...register('movementType')}
            options={[
              { value: 'RESTOCK', label: t('stockModal.restock') },
              { value: 'ADJUSTMENT', label: t('stockModal.adjustment') },
              { value: 'RETURN', label: t('stockModal.return') },
            ]}
          />

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('stockModal.notes')}
            </label>
            <textarea rows={2} className={inputCls} placeholder={t('stockModal.notesPh')} {...register('notes')} />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-slate-100 py-2.5 text-slate-800 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending || (needsStorePick && !effectiveStoreId)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
            >
              {isPending ? <Loader size={18} className="animate-spin" /> : t('common.apply')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
