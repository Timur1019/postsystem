// src/components/categories/CategoryModal.jsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { categoryApi } from '../../services/api';

const inputCls = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  dark:border-slate-700 dark:bg-slate-800 dark:text-white`;

export default function CategoryModal({ category, onClose, onSaved }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isEdit = !!category;

  const schema = z.object({
    name: z.string().min(1, t('validation.required')),
    description: z.string().optional(),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (category) {
      reset({ name: category.name, description: category.description ?? '' });
    } else {
      reset({ name: '', description: '' });
    }
  }, [category, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data) =>
      isEdit ? categoryApi.update(category.id, data) : categoryApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success(isEdit ? t('categories.updated') : t('categories.created'));
      onSaved?.();
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.message
          ?? (isEdit ? t('categories.updateFailed') : t('categories.createFailed'))
      ),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isEdit ? t('categories.modalTitleEdit') : t('categories.modalTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4 p-4">
          <div>
            <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">{t('categories.name')} *</label>
            <input {...register('name')} className={inputCls} placeholder={t('categories.namePh')} />
            {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">{t('categories.description')}</label>
            <textarea {...register('description')} rows={3} className={inputCls} placeholder={t('categories.descPh')} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {isPending ? t('common.loading') : isEdit ? t('categories.save') : t('categories.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
