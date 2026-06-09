// src/components/stores/StoreFormModal.jsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BUSINESS_TYPES } from '../../../../config/productCatalogTemplateRegistry';
import { useCompanyBusinessType } from '../../../../hooks/useCompanyBusinessType';

const inputCls = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900
  focus:outline-none focus:ring-2 focus:ring-emerald-500
  dark:border-slate-700 dark:bg-slate-800 dark:text-white`;

export default function StoreFormModal({
  open,
  onClose,
  onSubmit,
  isPending,
  initial,
  companies = [],
  showCompanySelect = false,
  title,
}) {
  const { t } = useTranslation();
  const { businessType: companyBusinessType } = useCompanyBusinessType();

  const schema = z.object({
    name: z.string().min(1, t('validation.fieldRequired', { field: t('stores.colName') })),
    address: z.string().optional(),
    phone: z.string().optional(),
    code: z.string().optional(),
    companyId: z.string().optional(),
    businessType: z.string().min(1, t('validation.fieldRequired', { field: t('stores.colBusinessType') })),
    active: z.boolean().optional(),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { active: true },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: initial?.name ?? '',
      address: initial?.address ?? '',
      phone: initial?.phone ?? '',
      code: initial?.code ?? '',
      companyId: initial?.companyId ? String(initial.companyId) : '',
      businessType: initial?.businessType ?? companyBusinessType ?? 'UNIVERSAL',
      active: initial?.active ?? true,
    });
  }, [open, initial, reset, companyBusinessType]);

  if (!open) return null;

  const handleFormSubmit = (data) => {
    onSubmit({
      name: data.name.trim(),
      address: data.address?.trim() || null,
      phone: data.phone?.trim() || null,
      code: data.code?.trim() || null,
      companyId: data.companyId ? Number(data.companyId) : undefined,
      businessType: data.businessType,
      active: data.active,
    });
  };

  const modalTitle = title ?? (initial ? t('stores.editTitle') : t('stores.addTitle'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{modalTitle}</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 p-5">
          {showCompanySelect && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{t('stores.colCompany')}</label>
              <select {...register('companyId')} className={inputCls}>
                <option value="">{t('stores.selectCompany')}</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{t('stores.colName')} *</label>
            <input {...register('name')} className={inputCls} />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{t('stores.colBusinessType')} *</label>
            <select {...register('businessType')} className={inputCls}>
              {BUSINESS_TYPES.map((bt) => (
                <option key={bt.code} value={bt.code}>
                  {t(`productTemplates.businessTypes.${bt.code}`)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('stores.businessTypeHint')}</p>
            {errors.businessType && <p className="mt-1 text-xs text-red-400">{errors.businessType.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{t('stores.colAddress')}</label>
            <textarea {...register('address')} rows={2} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{t('stores.colPhone')}</label>
            <input {...register('phone')} className={inputCls} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" {...register('active')} className="rounded border-slate-300" />
            {t('stores.activeLabel')}
          </label>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg bg-slate-100 py-2.5 text-sm text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
              {isPending && <Loader size={14} className="animate-spin" />}
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
