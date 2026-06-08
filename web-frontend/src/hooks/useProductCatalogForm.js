import { useEffect, useMemo, useRef, useState } from 'react';
import { getStockUnits } from '../utils/unitConfig';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { productApi } from '../services/api';
import {
  applyTemplateDefaults,
  defaultProductTypeForBusinessType,
  getProductTemplate,
  resolveProductTemplateCode,
  resolveCatalogSectionVisible,
} from '../config/productCatalogTemplateRegistry';
import { buildStorePrices, syncStoreRowPrices } from '../utils/productCatalogPrices';
import { UNIT_DEFAULTS } from '../utils/unitConfig';

const defaultFormValues = {
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
  clothingSizeRange: '',
  clothingColor: '',
  clothingGender: '',
  pharmacyExpiryRequired: false,
  pharmacyPrescriptionRequired: false,
  pharmacyDosageForm: '',
};

export function useProductCatalogForm(product, stores, onSaved, options = {}) {
  const { t } = useTranslation();
  const isEdit = !!product;
  const createTemplateCode = options.templateCode ?? null;
  const createAdvancedMode = options.advancedMode ?? false;
  const createUniversalMode = options.universalMode ?? false;
  const selectedStoreId = options.selectedStoreId ?? null;
  const selectedStoreBusinessType = options.selectedStoreBusinessType ?? null;
  const [editAdvancedMode, setEditAdvancedMode] = useState(false);
  const advancedMode = isEdit ? editAdvancedMode : createAdvancedMode;
  const universalMode = !isEdit && createUniversalMode;

  const { data: detail } = useQuery({
    queryKey: ['product', product?.id],
    queryFn: () => productApi.getById(product.id).then((r) => r.data),
    enabled: isEdit && !!product?.id,
  });
  const full = detail ?? product;

  const resolvedTemplateCode = isEdit
    ? resolveProductTemplateCode(full)
    : createTemplateCode;
  const templateCode = advancedMode ? null : resolvedTemplateCode;
  const template = getProductTemplate(templateCode);
  const templateLocked = Boolean(template && !advancedMode);

  const [storeRows, setStoreRows] = useState([{ storeId: '', price: '' }]);
  const [extraBarcodes, setExtraBarcodes] = useState(['']);
  const prevSellingRef = useRef(null);

  useEffect(() => {
    if (isEdit || !selectedStoreId) return;
    setStoreRows((rows) => {
      if (rows.length === 1 && !rows[0].storeId) {
        return [{ storeId: String(selectedStoreId), price: rows[0].price ?? '' }];
      }
      return rows.map((row, idx) => (
        idx === 0 ? { ...row, storeId: String(selectedStoreId) } : row
      ));
    });
  }, [selectedStoreId, isEdit]);

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
        unitCode: z.string().min(1, t('productCatalog.unitRequired')),
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
        clothingSizeRange: z.string().optional(),
        clothingColor: z.string().optional(),
        clothingGender: z.string().optional(),
        pharmacyExpiryRequired: z.boolean().optional(),
        pharmacyPrescriptionRequired: z.boolean().optional(),
        pharmacyDosageForm: z.string().optional(),
      }),
    [t]
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultFormValues,
  });

  const { register, handleSubmit, reset, setValue, getValues, watch, formState: { errors } } = form;

  useEffect(() => {
    if (!isEdit) setEditAdvancedMode(false);
  }, [isEdit, product?.id]);

  useEffect(() => {
    if (isEdit || !templateLocked || !template) return;
    reset({
      ...defaultFormValues,
      ...applyTemplateDefaults(template),
    });
  }, [isEdit, templateLocked, template, reset]);

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
      clothingSizeRange: full.retailExtras?.clothingSizeRange ?? '',
      clothingColor: full.retailExtras?.clothingColor ?? '',
      clothingGender: full.retailExtras?.clothingGender ?? '',
      pharmacyExpiryRequired: full.retailExtras?.pharmacyExpiryRequired ?? false,
      pharmacyPrescriptionRequired: full.retailExtras?.pharmacyPrescriptionRequired ?? false,
      pharmacyDosageForm: full.retailExtras?.pharmacyDosageForm ?? '',
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
    if (templateLocked) return;
    if (saleTypeWatch === 'SERVICE') {
      setValue('productType', 'SERVICE');
    }
  }, [saleTypeWatch, setValue, templateLocked]);

  useEffect(() => {
    if (isEdit || universalMode || !advancedMode || !selectedStoreBusinessType) return;
    if (saleTypeWatch === 'SERVICE') return;
    setValue('productType', defaultProductTypeForBusinessType(selectedStoreBusinessType));
  }, [
    isEdit,
    universalMode,
    advancedMode,
    selectedStoreBusinessType,
    saleTypeWatch,
    setValue,
  ]);

  useEffect(() => {
    if (templateLocked) return;
    if (saleTypeWatch === 'WEIGHT') {
      const currentUnit = getValues('unitCode');
      const measuredCodes = getStockUnits()
        .filter((u) => ['MASS', 'VOLUME', 'LENGTH', 'AREA'].includes(u.category))
        .map((u) => u.code);
      if (!measuredCodes.includes(currentUnit)) {
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
  }, [saleTypeWatch, getValues, setValue, templateLocked]);

  useEffect(() => {
    if (templateLocked) return;
    if (saleTypeWatch !== 'WEIGHT') return;
    const defaults = UNIT_DEFAULTS[unitCodeWatch];
    if (!defaults) return;
    setValue('unitOfMeasure', defaults.unitOfMeasure);
    setValue('quantityScale', defaults.quantityScale);
    setValue('allowFraction', defaults.allowFraction);
  }, [unitCodeWatch, saleTypeWatch, setValue, templateLocked]);

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

  const buildRetailExtrasPayload = (values) => {
    if (values.productType !== 'RETAIL') return undefined;
    const showClothing = showSection('clothing');
    const showPharmacy = showSection('pharmacy');
    const hasValues =
      values.clothingSizeRange?.trim()
      || values.clothingColor?.trim()
      || values.clothingGender
      || values.pharmacyDosageForm?.trim()
      || values.pharmacyExpiryRequired
      || values.pharmacyPrescriptionRequired;
    if (!showClothing && !showPharmacy && !hasValues) return undefined;
    return {
      clothingSizeRange: values.clothingSizeRange?.trim() || null,
      clothingColor: values.clothingColor?.trim() || null,
      clothingGender: values.clothingGender || null,
      pharmacyExpiryRequired: values.pharmacyExpiryRequired ?? false,
      pharmacyPrescriptionRequired: values.pharmacyPrescriptionRequired ?? false,
      pharmacyDosageForm: values.pharmacyDosageForm?.trim() || null,
    };
  };

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
      retailExtras: buildRetailExtrasPayload(values),
      storePrices,
      additionalBarcodes,
      templateCode: advancedMode ? null : (resolvedTemplateCode || null),
    };

    const stockQty = values.initialStock ?? 0;

    if (isEdit) {
      mutate({
        payload: { ...base, active: values.active },
        stockQty,
        isEditMode: true,
      });
    } else {
      mutate({
        payload: { sku: values.sku, initialStock: stockQty, ...base },
        stockQty: 0,
        isEditMode: false,
      });
    }
  };

  const showSection = (section) =>
    resolveCatalogSectionVisible(section, {
      classicMode: advancedMode && !universalMode,
      universalMode,
      template,
      productType: productTypeWatch,
    });

  return {
    t,
    isEdit,
    template,
    templateCode: resolvedTemplateCode,
    templateLocked,
    advancedMode,
    universalMode,
    canToggleAdvanced: Boolean(resolvedTemplateCode) && !universalMode,
    setAdvancedMode: setEditAdvancedMode,
    showSection,
    register,
    handleSubmit,
    setValue,
    getValues,
    errors,
    onSubmit,
    isPending,
    storeRows,
    setStoreRows,
    extraBarcodes,
    setExtraBarcodes,
    sellingPriceWatch,
    saleTypeWatch,
    productTypeWatch,
  };
}
