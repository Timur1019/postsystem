import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { stockReportApi } from '../../services/api';

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white';

export default function WriteOffModal({ product, storeId, onClose, onSaved }) {
  const { t } = useTranslation();
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
    mutationFn: (data) =>
      stockReportApi.createWriteOff({
        productId: product.id,
        quantity: data.quantity,
        reason: data.reason,
        notes: data.notes || undefined,
        storeId: storeId ?? undefined,
      }),
    onSuccess: () => {
      toast.success(t('stockReports.writeOffSuccess'));
      onSaved?.();
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stockReports.writeOffFailed')),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('stockReports.writeOffTitle')}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {product.name} · {t('stockReports.currentStock', { qty: product.stockQuantity })}
        </p>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t('stockReports.writeOffQty')}
            </label>
            <input type="number" min={1} className={inputCls} {...register('quantity')} />
            {errors.quantity && <p className="mt-1 text-xs text-red-600">{errors.quantity.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t('stockReports.writeOffReason')}
            </label>
            <select className={inputCls} {...register('reason')}>
              {['DEFECT', 'EXPIRED', 'DAMAGE', 'SHORTAGE', 'OTHER'].map((r) => (
                <option key={r} value={r}>{t(`stockReports.reasons.${r}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t('stockReports.writeOffNotes')}
            </label>
            <textarea className={inputCls} rows={2} {...register('notes')} />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {t('stockReports.writeOffSubmit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
