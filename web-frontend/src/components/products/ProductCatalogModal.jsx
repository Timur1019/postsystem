// src/components/products/ProductCatalogModal.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, Loader, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../services/api';
import TasnifSearchPanel from './TasnifSearchPanel';
import { buildStorePrices, syncStoreRowPrices } from '../../utils/productCatalogPrices';
import { MEASURED_UNIT_CODES, UNIT_DEFAULTS } from '../../utils/unitConfig';

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
  const prevSellingRef = useRef(null);

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
        defaultDiscountPercent: z.coerce.number().min(0).max(100).optional(),
        taxRate: z.coerce.number().min(0).max(100),
        initialStock: z.coerce.number().min(0).optional(),
        lowStockAlert: z.coerce.number().min(0).optional(),
        storageLocation: z.string().optional(),
        barcode: z.string().optional(),
        externalProductId: z.string().optional(),
        ikpu: z.string().optional(),
        productType: z.enum(['RETAIL', 'MATERIAL', 'DISH', 'SERVICE']),
        saleType: z.enum(['PIECE', 'WEIGHT', 'SERVICE']),
        unitCode: z.enum(['PCS', 'KG', 'G', 'L', 'M', 'MM']),
        quantityScale: z.coerce.number().min(0).max(3),
        allowFraction: z.boolean(),
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
        constructionStandardLength: z.coerce.number().min(0).optional(),
        constructionWidth: z.coerce.number().min(0).optional(),
        constructionThickness: z.coerce.number().min(0).optional(),
        constructionAllowCutting: z.boolean().optional(),
      }),
    [t]
  );

  const { register, handleSubmit, reset, setValue, getValues, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      taxRate: 0,
      defaultDiscountPercent: 0,
      lowStockAlert: 10,
      initialStock: 0,
      storageLocation: '',
      soldIndividually: true,
      markedProduct: false,
      active: true,
      ownerType: 'OWN',
      unitOfMeasure: 'pcs',
      productType: 'RETAIL',
      saleType: 'PIECE',
      unitCode: 'PCS',
      quantityScale: 0,
      allowFraction: false,
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
      defaultDiscountPercent: full.defaultDiscountPercent ?? 0,
      taxRate: full.taxRate ?? 0,
      lowStockAlert: full.lowStockAlert ?? 10,
      initialStock: full.stockQuantity ?? 0,
      storageLocation: full.storageLocation ?? '',
      barcode: full.barcode ?? '',
      externalProductId: full.externalProductId ?? '',
      ikpu: full.ikpu ?? '',
      productType: full.productType || (full.saleType === 'SERVICE' ? 'SERVICE' : 'RETAIL'),
      saleType: full.saleType || 'PIECE',
      unitCode: full.unitCode || 'PCS',
      quantityScale: full.quantityScale ?? 0,
      allowFraction: full.allowFraction ?? false,
      unitOfMeasure: full.unitOfMeasure || 'pcs',
      unitMeasureCode: full.unitMeasureCode ?? '',
      packageCode: full.packageCode ?? '',
      soldIndividually: full.soldIndividually !== false,
      markedProduct: !!full.markedProduct,
      active: full.active !== false,
      ownerType: full.ownerType || 'OWN',
      commissionTin: full.commissionTin ?? '',
      commissionPinfl: full.commissionPinfl ?? '',
      constructionStandardLength: full.constructionDetails?.standardLength ?? '',
      constructionWidth: full.constructionDetails?.width ?? '',
      constructionThickness: full.constructionDetails?.thickness ?? '',
      constructionAllowCutting: full.constructionDetails?.allowCutting ?? false,
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
    prevSellingRef.current = full.sellingPrice ?? null;
  }, [full, reset, isEdit]);

  const sellingPriceWatch = watch('sellingPrice');
  const costPriceWatch = watch('costPrice');
  const saleTypeWatch = watch('saleType');
  const productTypeWatch = watch('productType');
  const unitCodeWatch = watch('unitCode');

  useEffect(() => {
    if (saleTypeWatch === 'SERVICE') {
      setValue('productType', 'SERVICE');
    }
  }, [saleTypeWatch, setValue]);

  useEffect(() => {
    if (saleTypeWatch === 'WEIGHT') {
      const currentUnit = getValues('unitCode');
      if (!MEASURED_UNIT_CODES.includes(currentUnit)) {
        setValue('unitCode', 'KG');
        const defaults = UNIT_DEFAULTS.KG;
        setValue('unitOfMeasure', defaults.unitOfMeasure);
        setValue('quantityScale', defaults.quantityScale);
        setValue('allowFraction', defaults.allowFraction);
      } else {
        setValue('allowFraction', true);
      }
    } else if (saleTypeWatch === 'SERVICE') {
      const defaults = UNIT_DEFAULTS.PCS;
      setValue('unitCode', 'PCS');
      setValue('unitOfMeasure', defaults.unitOfMeasure);
      setValue('quantityScale', defaults.quantityScale);
      setValue('allowFraction', defaults.allowFraction);
    } else if (saleTypeWatch === 'PIECE') {
      const defaults = UNIT_DEFAULTS.PCS;
      setValue('unitCode', 'PCS');
      setValue('unitOfMeasure', defaults.unitOfMeasure);
      setValue('quantityScale', defaults.quantityScale);
      setValue('allowFraction', defaults.allowFraction);
    }
  }, [saleTypeWatch, getValues, setValue]);

  useEffect(() => {
    if (saleTypeWatch !== 'WEIGHT') return;
    const defaults = UNIT_DEFAULTS[unitCodeWatch];
    if (!defaults) return;
    setValue('unitOfMeasure', defaults.unitOfMeasure);
    setValue('quantityScale', defaults.quantityScale);
    setValue('allowFraction', defaults.allowFraction);
  }, [unitCodeWatch, saleTypeWatch, setValue]);

  useEffect(() => {
    if (sellingPriceWatch == null || sellingPriceWatch === '') return;
    setStoreRows((rows) =>
      syncStoreRowPrices(rows, sellingPriceWatch, prevSellingRef.current, costPriceWatch)
    );
    prevSellingRef.current = sellingPriceWatch;
  }, [sellingPriceWatch, costPriceWatch]);

  const resolveStockStoreId = () => {
    const fromRows = storeRows.map((r) => r.storeId).filter(Boolean);
    if (fromRows.length === 1) return Number(fromRows[0]);
    if (stores?.length === 1) return stores[0].id;
    return null;
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ payload, stockQty, isEditMode }) => {
      const res = isEditMode
        ? await productApi.update(product.id, payload)
        : await productApi.create(payload);
      if (isEditMode) {
        const stockStoreId = resolveStockStoreId();
        if (!stockStoreId) {
          throw new Error(t('stockModal.storeRequired'));
        }
        const prev = await productApi
          .getById(product.id, { storeId: stockStoreId })
          .then((r) => r.data.stockQuantity);
        const delta = stockQty - prev;
        if (delta !== 0) {
          await productApi.adjustStock(
            product.id,
            delta,
            'ADJUSTMENT',
            t('productCatalog.stockEditNote'),
            stockStoreId
          );
        }
      }
      return res;
    },
    onSuccess: () => {
      toast.success(isEdit ? t('productModal.updated') : t('productModal.created'));
      onSaved();
    },
    onError: (err) => toast.error(err.response?.data?.message ?? t('productModal.saveFailed')),
  });

  const onSubmit = (values) => {
    const storePrices = buildStorePrices(storeRows, values.sellingPrice);

    const additionalBarcodes = extraBarcodes.map((b) => b.trim()).filter(Boolean);

    const base = {
      name: values.name,
      description: values.description || undefined,
      categoryId: values.categoryId || null,
      costPrice: values.costPrice,
      sellingPrice: values.sellingPrice,
      defaultDiscountPercent: values.defaultDiscountPercent ?? 0,
      taxRate: values.taxRate,
      lowStockAlert: values.lowStockAlert,
      storageLocation: values.storageLocation?.trim() || null,
      barcode: values.barcode || undefined,
      externalProductId: values.externalProductId || undefined,
      ikpu: values.ikpu || undefined,
      productType: values.productType,
      saleType: values.saleType,
      unitCode: values.unitCode,
      quantityScale: values.quantityScale,
      allowFraction: values.allowFraction,
      unitOfMeasure: values.unitOfMeasure,
      unitMeasureCode: values.unitMeasureCode || undefined,
      packageCode: values.packageCode || undefined,
      soldIndividually: values.productType === 'RETAIL' ? values.soldIndividually : undefined,
      markedProduct: values.productType === 'RETAIL' ? values.markedProduct : undefined,
      constructionDetails:
        values.productType === 'MATERIAL'
          ? {
              standardLength: values.constructionStandardLength || undefined,
              width: values.constructionWidth || undefined,
              thickness: values.constructionThickness || undefined,
              allowCutting: values.constructionAllowCutting ?? false,
            }
          : undefined,
      ownerType: values.ownerType,
      commissionTin: values.commissionTin || undefined,
      commissionPinfl: values.commissionPinfl || undefined,
      storePrices,
      additionalBarcodes,
    };

    const stockQty = values.initialStock ?? 0;

    if (isEdit) {
      mutate({
        payload: {
          ...base,
          active: values.active,
        },
        stockQty,
        isEditMode: true,
      });
    } else {
      mutate({
        payload: {
          sku: values.sku,
          initialStock: stockQty,
          ...base,
        },
        stockQty: 0,
        isEditMode: false,
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
              <Field label={t('productCatalog.productType')} required error={errors.productType?.message}>
                <select {...register('productType')} className={inputCls}>
                  <option value="RETAIL">{t('productCatalog.productTypeRetail')}</option>
                  <option value="MATERIAL">{t('productCatalog.productTypeMaterial')}</option>
                  <option value="DISH">{t('productCatalog.productTypeDish')}</option>
                  <option value="SERVICE">{t('productCatalog.productTypeService')}</option>
                </select>
              </Field>
              <Field label={t('productCatalog.saleType')} required error={errors.saleType?.message}>
                <select {...register('saleType')} className={inputCls}>
                  <option value="PIECE">{t('productCatalog.saleTypePiece')}</option>
                  <option value="WEIGHT">{t('productCatalog.saleTypeWeight')}</option>
                  <option value="SERVICE">{t('productCatalog.saleTypeService')}</option>
                </select>
              </Field>
              <Field label={t('productCatalog.unitCode')} required error={errors.unitCode?.message}>
                <select {...register('unitCode')} className={inputCls}>
                  {saleTypeWatch !== 'WEIGHT' ? (
                    <option value="PCS">{t('productCatalog.unitCodePcs')}</option>
                  ) : (
                    <>
                      <option value="KG">{t('productCatalog.unitCodeKg')}</option>
                      <option value="G">{t('productCatalog.unitCodeG')}</option>
                      <option value="L">{t('productCatalog.unitCodeL')}</option>
                      <option value="M">{t('productCatalog.unitCodeM')}</option>
                      <option value="MM">{t('productCatalog.unitCodeMm')}</option>
                    </>
                  )}
                </select>
              </Field>
              <Field label={t('productCatalog.quantityScale')} error={errors.quantityScale?.message}>
                <select {...register('quantityScale')} className={inputCls}>
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </Field>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300 md:col-span-2">
                <input type="checkbox" {...register('allowFraction')} className="rounded border-slate-400 dark:border-slate-600" />
                {t('productCatalog.allowFraction')}
              </label>
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
            {productTypeWatch === 'MATERIAL' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                <p className="md:col-span-2 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                  {t('productCatalog.sectionConstruction')}
                </p>
                <Field label={t('productCatalog.constructionStandardLength')} error={errors.constructionStandardLength?.message}>
                  <input type="number" step="0.01" {...register('constructionStandardLength')} className={inputCls} />
                </Field>
                <Field label={t('productCatalog.constructionWidth')} error={errors.constructionWidth?.message}>
                  <input type="number" step="0.01" {...register('constructionWidth')} className={inputCls} />
                </Field>
                <Field label={t('productCatalog.constructionThickness')} error={errors.constructionThickness?.message}>
                  <input type="number" step="0.01" {...register('constructionThickness')} className={inputCls} />
                </Field>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300 md:col-span-2">
                  <input type="checkbox" {...register('constructionAllowCutting')} className="rounded border-slate-400 dark:border-slate-600" />
                  {t('productCatalog.constructionAllowCutting')}
                </label>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-6">
              {productTypeWatch === 'RETAIL' ? (
                <>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input type="checkbox" {...register('soldIndividually')} className="rounded border-slate-400 dark:border-slate-600" />
                    {t('productCatalog.soldByPiece')}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input type="checkbox" {...register('markedProduct')} className="rounded border-slate-400 dark:border-slate-600" />
                    {t('productCatalog.marked')}
                  </label>
                </>
              ) : null}
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
              {t('productCatalog.sectionAccounting')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label={t('productModal.cost')} error={errors.costPrice?.message}>
                <input {...register('costPrice', { valueAsNumber: true })} type="number" step="0.01" className={inputCls} />
              </Field>
              <Field label={t('productModal.price')} error={errors.sellingPrice?.message}>
                <input {...register('sellingPrice', { valueAsNumber: true })} type="number" step="0.01" className={inputCls} />
              </Field>
              <Field label={t('productCatalog.defaultDiscount')} error={errors.defaultDiscountPercent?.message}>
                <input
                  {...register('defaultDiscountPercent', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className={inputCls}
                />
              </Field>
              <Field label={t('productModal.lowStock')} error={errors.lowStockAlert?.message}>
                <input {...register('lowStockAlert', { valueAsNumber: true })} type="number" className={inputCls} />
              </Field>
              <Field label={t('productModal.initialStock')} error={errors.initialStock?.message}>
                <input {...register('initialStock', { valueAsNumber: true })} type="number" min="0" className={inputCls} />
              </Field>
              <Field label={t('stockModule.modal.location')} error={errors.storageLocation?.message}>
                <input
                  {...register('storageLocation')}
                  className={inputCls}
                  placeholder={t('stockModule.modal.locationPh')}
                />
              </Field>
            </div>
            <Field label={t('productModal.description')} error={errors.description?.message}>
              <textarea {...register('description')} rows={2} className={`${inputCls} resize-none`} />
            </Field>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              {t('productCatalog.sectionPrices')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('productCatalog.storePriceHint')}</p>
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
                        const sell = getValues('sellingPrice');
                        setStoreRows((rs) =>
                          rs.map((r, i) => {
                            if (i !== idx) return r;
                            const price =
                              r.price === '' && sell != null && sell !== ''
                                ? String(sell)
                                : r.price;
                            return { ...r, storeId: v, price };
                          })
                        );
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
                    <label className="text-xs text-slate-600 dark:text-slate-500">
                      {t('productCatalog.storeSellingPrice')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className={inputCls}
                      placeholder={sellingPriceWatch != null ? String(sellingPriceWatch) : ''}
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
