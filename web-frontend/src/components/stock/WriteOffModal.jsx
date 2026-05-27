import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { productApi, stockReportApi } from '../../services/api';
import { useCompanyStores } from '../../hooks/useCompanyStores';

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white';

export default function WriteOffModal({ product, storeId: storeIdProp, onClose, onSaved }) {
  const { t } = useTranslation();
  const { stores, onlyStore, needsStorePick, resolveStoreId } = useCompanyStores();
  const [storeId, setStoreId] = useState(storeIdProp != null ? String(storeIdProp) : '');

  useEffect(() => {
    if (storeIdProp != null) setStoreId(String(storeIdProp));
    else if (onlyStore) setStoreId(String(onlyStore.id));
  }, [storeIdProp, onlyStore]);

  const effectiveStoreId = storeIdProp ?? resolveStoreId(storeId);

  const { data: productAtStore } = useQuery({
    queryKey: ['product-stock', product.id, effectiveStoreId],
    queryFn: () => productApi.getById(product.id, { storeId: effectiveStoreId }).then((r) => r.data),
    enabled: !!effectiveStoreId,
  });

  const displayQty = productAtStore?.stockQuantity ?? product.stockQuantity;

  const schema = z.object({
    quantity: z.coerce.number().int().min(1),
    reason: z.enum(['DEFECT', 'EXPIRED', 'DAMAGE', 'SHORTAGE', 'OTHER']),
    notes: z.string().optional(),
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1, reason: 'DEFECT', notes: '' },
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      const sid = storeIdProp ?? resolveStoreId(storeId);
      if (!sid) {
        return Promise.reject(new Error(t('stockModal.storeRequired')));
      }
      return stockReportApi.createWriteOff({
        productId: product.id,
        quantity: data.quantity,
        reason: data.reason,
        notes: data.notes || undefined,
        storeId: sid,
      });
    },
    onSuccess: () => {
      toast.success(t('stockReports.writeOffSuccess'));
      onSaved?.();
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? e.message ?? t('stockReports.writeOffFailed')),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('stockReports.writeOffTitle')}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {product.name} · {t('stockReports.currentStock', { qty: displayQty })}
        </p>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          {needsStorePick && storeIdProp == null ? (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {t('stockReports.colStore')}
              </label>
              <select
                className={inputCls}
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                required
              >
                <option value="">{t('stockModal.pickStore')}</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label className="mb-1 block text-xs font-medium">{t('stockReports.writeOffQty')}</label>
            <input type="number" min={1} className={inputCls} {...register('quantity')} />
            {errors.quantity && <p className="mt-1 text-xs text-red-600">{errors.quantity.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t('stockReports.writeOffReason')}</label>
            <select className={inputCls} {...register('reason')}>
              <option value="DEFECT">{t('stockReports.reasonDefect')}</option>
              <option value="EXPIRED">{t('stockReports.reasonExpired')}</option>
              <option value="DAMAGE">{t('stockReports.reasonDamage')}</option>
              <option value="SHORTAGE">{t('stockReports.reasonShortage')}</option>
              <option value="OTHER">{t('stockReports.reasonOther')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t('stockReports.writeOffNotes')}</label>
            <textarea rows={2} className={inputCls} {...register('notes')} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" className="flex-1 rounded-lg border py-2 text-sm" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || (needsStorePick && storeIdProp == null && !effectiveStoreId)}
              className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {t('stockReports.writeOffSubmit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
