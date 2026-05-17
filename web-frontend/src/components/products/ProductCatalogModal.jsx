// src/components/products/ProductCatalogModal.jsx
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, Loader, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../services/api';
import TasnifSearchPanel from './TasnifSearchPanel';

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
        {required && <span className="text-red-400">* </span>}
        {label}
      </label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inputCls = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm
                  placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500
                  dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500`;

const OWNER_TYPES = ['OWN', 'COMMISSION', 'AGENT'];
const VAT_OPTIONS = [0, 12, 15, 16];

export default function ProductCatalogModal({ product, categories, stores, onClose, onSaved }) {
  const { t } = useTranslation();
  const isEdit = !!product;

  const { data: detail } = useQuery({
    queryKey: ['product', product?.id],
    queryFn: () => productApi.getById(product.id).then((r) => r.data),
    enabled: isEdit && !!product?.id,
  });
  const full = detail ?? product;

  const [storeRows, setStoreRows] = useState([{ storeId: '', price: '' }]);
  const [extraBarcodes, setExtraBarcodes] = useState(['']);

  const schema = useMemo(
    () =>
      z.object({
        sku: z.string().min(1, t('validation.skuRequired')),
        name: z.string().min(2, t('validation.nameMin')),
        description: z.string().optional(),
        categoryId: z
          .union([z.literal(''), z.coerce.number()])
          .optional()
          .transform((v) => (v === '' || v == null ? null : v)),
        costPrice: z.coerce.number().min(0, t('validation.costPrice')),
        sellingPrice: z.coerce.number().min(0.01, t('validation.sellingPrice')),
        taxRate: z.coerce.number().min(0).max(100),
        initialStock: z.coerce.number().min(0).optional(),
        lowStockAlert: z.coerce.number().min(0).optional(),
        barcode: z.string().optional(),
        externalProductId: z.string().optional(),
        ikpu: z.string().optional(),
        unitOfMeasure: z.string().min(1, t('productCatalog.unitRequired')),
        unitMeasureCode: z.string().optional(),
        packageCode: z.string().optional(),
        soldIndividually: z.boolean(),
        markedProduct: z.boolean(),
        active: z.boolean(),
        ownerType: z.string().min(1, t('productCatalog.ownerRequired')),
        commissionTin: z
          .string()
          .optional()
          .refine((v) => !v || /^\d{0,9}$/.test(v), t('productCatalog.tinDigits')),
        commissionPinfl: z
          .string()
          .optional()
          .refine((v) => !v || /^\d{0,14}$/.test(v), t('productCatalog.pinflDigits')),
      }),
    [t]
  );

  const { register, handleSubmit, reset, setValue, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      taxRate: 0,
      lowStockAlert: 10,
      initialStock: 0,
      soldIndividually: true,
      markedProduct: false,
      active: true,
      ownerType: 'OWN',
      unitOfMeasure: 'pcs',
    },
  });

  useEffect(() => {
    if (!full) return;
    reset({
      sku: full.sku,
      name: full.name,
      description: full.description ?? '',
      categoryId: full.categoryId != null ? full.categoryId : '',
      costPrice: full.costPrice,
      sellingPrice: full.sellingPrice,
      taxRate: full.taxRate ?? 0,
      lowStockAlert: full.lowStockAlert ?? 10,
      ...(!isEdit ? { initialStock: full.stockQuantity ?? 0 } : {}),
      barcode: full.barcode ?? '',
      externalProductId: full.externalProductId ?? '',
      ikpu: full.ikpu ?? '',
      unitOfMeasure: full.unitOfMeasure || 'pcs',
      unitMeasureCode: full.unitMeasureCode ?? '',
      packageCode: full.packageCode ?? '',
      soldIndividually: full.soldIndividually !== false,
      markedProduct: !!full.markedProduct,
      active: full.active !== false,
      ownerType: full.ownerType || 'OWN',
      commissionTin: full.commissionTin ?? '',
      commissionPinfl: full.commissionPinfl ?? '',
    });
    const prices = (full.storePrices && full.storePrices.length > 0
      ? full.storePrices
      : [{ storeId: '', price: '' }]).map((r) => ({
      storeId: r.storeId ?? '',
      price: r.price ?? '',
    }));
    setStoreRows(prices);
    const extras = (full.barcodes || []).filter((b) => b && b !== full.barcode);
    setExtraBarcodes(extras.length ? extras : ['']);
  }, [full, reset, isEdit]);

  const { mutate, isPending } = useMutation({
    mutationFn: (payload) =>
      isEdit ? productApi.update(product.id, payload) : productApi.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? t('productModal.updated') : t('productModal.created'));
      onSaved();
    },
    onError: (err) => toast.error(err.response?.data?.message ?? t('productModal.saveFailed')),
  });

  const onSubmit = (values) => {
    const storePrices = storeRows
      .filter((r) => r.storeId !== '' && r.storeId != null && r.price !== '' && !Number.isNaN(Number(r.price)))
      .map((r) => ({ storeId: Number(r.storeId), price: Number(r.price) }));

    const additionalBarcodes = extraBarcodes.map((b) => b.trim()).filter(Boolean);

    const base = {
      name: values.name,
      description: values.description || undefined,
      categoryId: values.categoryId || null,
      costPrice: values.costPrice,
      sellingPrice: values.sellingPrice,
      taxRate: values.taxRate,
      lowStockAlert: values.lowStockAlert,
      barcode: values.barcode || undefined,
      externalProductId: values.externalProductId || undefined,
      ikpu: values.ikpu || undefined,
      unitOfMeasure: values.unitOfMeasure,
      unitMeasureCode: values.unitMeasureCode || undefined,
      packageCode: values.packageCode || undefined,
      soldIndividually: values.soldIndividually,
      markedProduct: values.markedProduct,
      ownerType: values.ownerType,
      commissionTin: values.commissionTin || undefined,
      commissionPinfl: values.commissionPinfl || undefined,
      storePrices,
      additionalBarcodes,
    };

    if (isEdit) {
      mutate({
        ...base,
        active: values.active,
      });
    } else {
      mutate({
        sku: values.sku,
        initialStock: values.initialStock,
        ...base,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEdit ? t('productCatalog.editTitle') : t('productCatalog.addTitle')}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-8">
          <TasnifSearchPanel setValue={setValue} getValues={getValues} isEdit={isEdit} />

          <section className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              {t('productCatalog.sectionGeneral')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label={t('productCatalog.externalId')} error={errors.externalProductId?.message}>
                <input {...register('externalProductId')} className={inputCls} />
              </Field>
              <Field label={t('productModal.sku')} required error={errors.sku?.message}>
                <input {...register('sku')} disabled={isEdit} className={inputCls} />
              </Field>
              <Field label={t('productCatalog.ikpu')} required={false} error={errors.ikpu?.message}>
                <input {...register('ikpu')} className={inputCls} />
              </Field>
              <Field label={t('productModal.category')} error={errors.categoryId?.message}>
                <select {...register('categoryId')} className={inputCls}>
                  <option value="">{t('productModal.noneCategory')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('productModal.name')} required error={errors.name?.message}>
                <input {...register('name')} className={inputCls} />
              </Field>
              <Field label={t('productCatalog.unit')} required error={errors.unitOfMeasure?.message}>
                <input {...register('unitOfMeasure')} className={inputCls} />
              </Field>
              <Field label={t('productCatalog.unitCode')} error={errors.unitMeasureCode?.message}>
                <input {...register('unitMeasureCode')} placeholder="1–999" className={inputCls} />
              </Field>
              <Field label={t('productCatalog.packageCode')} error={errors.packageCode?.message}>
                <input {...register('packageCode')} placeholder="1–9999999" className={inputCls} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" {...register('soldIndividually')} className="rounded border-slate-400 dark:border-slate-600" />
                {t('productCatalog.soldByPiece')}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" {...register('markedProduct')} className="rounded border-slate-400 dark:border-slate-600" />
                {t('productCatalog.marked')}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" {...register('active')} className="rounded border-slate-400 dark:border-slate-600" />
                {t('productCatalog.active')}
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label={t('productCatalog.ownerType')} required error={errors.ownerType?.message}>
                <select {...register('ownerType')} className={inputCls}>
                  {OWNER_TYPES.map((o) => (
                    <option key={o} value={o}>
                      {t(`productCatalog.owner.${o}`, o)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('productCatalog.vat')} error={errors.taxRate?.message}>
                <select {...register('taxRate', { valueAsNumber: true })} className={inputCls}>
                  {VAT_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v}%
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('productCatalog.commissionTin')} error={errors.commissionTin?.message}>
                <input {...register('commissionTin')} maxLength={9} className={inputCls} />
              </Field>
              <Field label={t('productCatalog.commissionPinfl')} error={errors.commissionPinfl?.message}>
                <input {...register('commissionPinfl')} maxLength={14} className={inputCls} />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              {t('productCatalog.sectionPrices')}
            </h3>
            <div className="space-y-2">
              {storeRows.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-slate-600 dark:text-slate-500">{t('productCatalog.store')}</label>
                    <select
                      className={inputCls}
                      value={row.storeId}
                      onChange={(e) => {
                        const v = e.target.value;
                        setStoreRows((rs) => rs.map((r, i) => (i === idx ? { ...r, storeId: v } : r)));
                      }}
                    >
                      <option value="">{t('productCatalog.storePlaceholder')}</option>
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-36">
                    <label className="text-xs text-slate-600 dark:text-slate-500">{t('productCatalog.price')}</label>
                    <input
                      type="number"
                      step="0.01"
                      className={inputCls}
                      value={row.price}
                      onChange={(e) => {
                        const v = e.target.value;
                        setStoreRows((rs) => rs.map((r, i) => (i === idx ? { ...r, price: v } : r)));
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="p-2 text-slate-500 hover:text-red-500 dark:hover:text-red-400"
                    onClick={() => setStoreRows((rs) => rs.filter((_, i) => i !== idx))}
                    disabled={storeRows.length <= 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setStoreRows((rs) => [...rs, { storeId: '', price: '' }])}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <Plus size={14} /> {t('productCatalog.addStoreRow')}
              </button>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              {t('productCatalog.sectionBarcodes')}
            </h3>
            <Field label={t('productModal.barcode')} error={errors.barcode?.message}>
              <input {...register('barcode')} className={inputCls} />
            </Field>
            {extraBarcodes.map((val, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  className={inputCls}
                  value={val}
                  placeholder={t('productCatalog.extraBarcodePh')}
                  onChange={(e) =>
                    setExtraBarcodes((xs) => xs.map((x, i) => (i === idx ? e.target.value : x)))
                  }
                />
                <button
                  type="button"
                  className="p-2 text-slate-500 hover:text-red-500 dark:hover:text-red-400"
                  onClick={() => setExtraBarcodes((xs) => xs.filter((_, i) => i !== idx))}
                  disabled={extraBarcodes.length <= 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setExtraBarcodes((xs) => [...xs, ''])}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <Plus size={14} /> {t('productCatalog.addBarcode')}
            </button>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              {t('productCatalog.sectionAccounting')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label={t('productModal.cost')} error={errors.costPrice?.message}>
                <input {...register('costPrice', { valueAsNumber: true })} type="number" step="0.01" className={inputCls} />
              </Field>
              <Field label={t('productModal.price')} error={errors.sellingPrice?.message}>
                <input {...register('sellingPrice', { valueAsNumber: true })} type="number" step="0.01" className={inputCls} />
              </Field>
              <Field label={t('productModal.lowStock')} error={errors.lowStockAlert?.message}>
                <input {...register('lowStockAlert', { valueAsNumber: true })} type="number" className={inputCls} />
              </Field>
            </div>
            {!isEdit && (
              <Field label={t('productModal.initialStock')} error={errors.initialStock?.message}>
                <input {...register('initialStock', { valueAsNumber: true })} type="number" className={inputCls} />
              </Field>
            )}
            <Field label={t('productModal.description')} error={errors.description?.message}>
              <textarea {...register('description')} rows={2} className={`${inputCls} resize-none`} />
            </Field>
          </section>

          <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/30 dark:text-sky-400/90">
            {t('productCatalog.requiredHint')}
          </p>

          <div className="flex gap-3 border-t border-slate-200 pt-2 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-slate-100 py-2.5 text-sm text-slate-800 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
            >
              {isPending && <Loader size={14} className="animate-spin" />}
              {isEdit ? t('productModal.saveChanges') : t('productCatalog.submitAdd')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
