// src/components/cash-registers/CashRegisterConfigAddModal.jsx
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BaseSelect } from '../../../components/ui';
import { cashRegisterConfigApi } from '../../../services/api';
import '../../../styles/cash-registers/config.css';

const inputCls = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  dark:border-slate-700 dark:bg-slate-800 dark:text-white`;

export default function CashRegisterConfigAddModal({ open, onClose, onSaved }) {
  const { t } = useTranslation();
  const [storeIds, setStoreIds] = useState(() => new Set());
  const [registerIds, setRegisterIds] = useState(() => new Set());
  const [categoryIds, setCategoryIds] = useState(() => new Set());
  const [pickCategoryId, setPickCategoryId] = useState('');

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t('cashRegisters.configNameRequired')),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  const { data: formOptions, isPending, isError } = useQuery({
    queryKey: ['cash-register-config-form-options'],
    queryFn: () => cashRegisterConfigApi.getFormOptions().then((r) => r.data),
    enabled: open,
  });

  const stores = formOptions?.stores ?? [];
  const allRegisters = formOptions?.registers ?? [];
  const categories = formOptions?.categories ?? [];

  const visibleRegisters = useMemo(() => {
    if (storeIds.size === 0) return allRegisters;
    return allRegisters.filter((r) => storeIds.has(r.storeId));
  }, [allRegisters, storeIds]);

  useEffect(() => {
    if (!open) return;
    reset({ name: '' });
    setStoreIds(new Set());
    setRegisterIds(new Set());
    setCategoryIds(new Set());
    setPickCategoryId('');
  }, [open, reset]);

  useEffect(() => {
    if (storeIds.size === 0) return;
    setRegisterIds((prev) => {
      const allowed = new Set(visibleRegisters.map((r) => r.id));
      const next = new Set([...prev].filter((id) => allowed.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [storeIds, visibleRegisters]);

  const availableCategories = useMemo(
    () => categories.filter((c) => !categoryIds.has(c.id)),
    [categories, categoryIds]
  );

  const selectedCategories = useMemo(
    () => categories.filter((c) => categoryIds.has(c.id)),
    [categories, categoryIds]
  );

  const toggleStore = (id) => {
    setStoreIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleRegister = (id) => {
    setRegisterIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const addPickedCategory = () => {
    if (!pickCategoryId) return;
    const id = Number(pickCategoryId);
    if (!Number.isFinite(id)) return;
    setCategoryIds((prev) => new Set(prev).add(id));
    setPickCategoryId('');
  };

  const removeCategory = (id) => {
    setCategoryIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  };

  const onSubmit = async (values) => {
    try {
      await cashRegisterConfigApi.create({
        name: values.name.trim(),
        storeIds: [...storeIds],
        cashRegisterIds: [...registerIds],
        categoryIds: [...categoryIds],
      });
      toast.success(t('cashRegisters.configCreated'));
      onSaved();
      onClose();
    } catch (e) {
      const msg = e?.response?.data?.message ?? e?.message ?? t('cashRegisters.configCreateFailed');
      toast.error(msg);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('cashRegisters.configModalTitle')}</h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {isError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {t('cashRegisters.configCreateFailed')}
              </p>
            )}

            {isPending ? (
              <p className="text-sm text-slate-500">{t('common.loading')}</p>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    * {t('cashRegisters.configNameLabel')}
                  </label>
                  <input {...register('name')} className={`${inputCls} ${errors.name ? 'border-red-500' : ''}`} />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                </div>

                <div>
                  <div className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    {t('cashRegisters.configStoresLabel')}
                  </div>
                  <div className="crc-modal__pick-list">
                    {stores.length === 0 ? (
                      <p className="crc-modal__empty">{t('cashRegisters.configEmptyStores')}</p>
                    ) : (
                      stores.map((s) => (
                        <label key={s.id} className="crc-modal__pick-row">
                          <input type="checkbox" checked={storeIds.has(s.id)} onChange={() => toggleStore(s.id)} />
                          <span>{s.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    {t('cashRegisters.configRegistersLabel')}
                  </div>
                  <div className="crc-modal__pick-list">
                    {visibleRegisters.length === 0 ? (
                      <p className="crc-modal__empty">
                        {storeIds.size > 0
                          ? t('cashRegisters.configEmptyRegisters')
                          : t('cashRegisters.configEmptyRegisters')}
                      </p>
                    ) : (
                      visibleRegisters.map((r) => (
                        <label key={r.id} className="crc-modal__pick-row">
                          <input type="checkbox" checked={registerIds.has(r.id)} onChange={() => toggleRegister(r.id)} />
                          <span className="break-all">
                            {r.storeName} · №{r.registerNumber}
                            {r.equipmentSerial ? ` · ${r.equipmentSerial}` : ''}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    {t('cashRegisters.configCategoriesLabel')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <BaseSelect
                      className="min-w-0 flex-1"
                      value={pickCategoryId}
                      onChange={(e) => setPickCategoryId(e.target.value)}
                      disabled={availableCategories.length === 0}
                      placeholder={t('cashRegisters.configSelectCategory')}
                      options={[
                        { value: '', label: t('cashRegisters.configSelectCategory') },
                        ...availableCategories.map((c) => ({
                          value: String(c.id),
                          label: c.name,
                        })),
                      ]}
                    />
                    <button
                      type="button"
                      onClick={addPickedCategory}
                      disabled={!pickCategoryId}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {t('cashRegisters.configAddCategory')}
                    </button>
                  </div>

                  <div className="crc-modal__categories-grid">
                    <div className="crc-modal__category-panel">
                      <div className="crc-modal__category-panel-title">
                        {t('cashRegisters.configAvailableCategories')}
                      </div>
                      <div className="crc-modal__category-panel-body">
                        {categories.length === 0 ? (
                          <p className="crc-modal__empty">{t('cashRegisters.configEmptyCategories')}</p>
                        ) : availableCategories.length === 0 ? (
                          <p className="crc-modal__empty">{t('cashRegisters.configNoCategoriesLeft')}</p>
                        ) : (
                          availableCategories.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className="crc-modal__category-item crc-modal__category-item--add"
                              onClick={() => setCategoryIds((prev) => new Set(prev).add(c.id))}
                            >
                              <span className="truncate">+ {c.name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="crc-modal__category-panel">
                      <div className="crc-modal__category-panel-title">
                        {t('cashRegisters.configSelectedCategories')}
                      </div>
                      <div className="crc-modal__category-panel-body">
                        {selectedCategories.length === 0 ? (
                          <p className="crc-modal__empty">{t('cashRegisters.configPickCategoryHint')}</p>
                        ) : (
                          selectedCategories.map((c) => (
                            <div key={c.id} className="crc-modal__category-item">
                              <span className="truncate">{c.name}</span>
                              <button
                                type="button"
                                className="shrink-0 text-red-600 hover:text-red-700"
                                onClick={() => removeCategory(c.id)}
                                aria-label={t('common.delete')}
                              >
                                ×
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-600"
            >
              {t('cashRegisters.configModalAdd')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
