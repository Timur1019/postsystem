import { useEffect, useMemo, useRef, useState } from 'react';
import { getStockUnits, UNIT_DEFAULTS } from '../../../utils/unitConfig';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../../api';
import {
  applyTemplateDefaults,
  defaultProductTypeForBusinessType,
  getProductTemplate,
  resolveProductTemplateCode,
  resolveCatalogSectionVisible,
  resolveBusinessTypeForTemplates,
} from '../../../config/productCatalogTemplateRegistry';
import { syncStoreRowPrices } from '../../../utils/productCatalogPrices';
import useBusinessConfig from '../../../hooks/useBusinessConfig';
import { useCompanyBusinessType } from '../../../hooks/useCompanyBusinessType';
import { businessAttributeFieldName } from '../components/products/catalog/ProductCatalogDynamicFieldsSection';
import { buildProductCatalogPayload } from '../utils/buildProductCatalogPayload';
import {
  attributeFormValue,
  defaultProductCatalogFormValues,
} from '../utils/productCatalogFormDefaults';
import { createProductCatalogFormSchema } from '../utils/productCatalogFormSchema';

export function useProductCatalogForm(product, stores, onSaved, options = {}) {
  const { t } = useTranslation();
  const isEdit = !!product;
  const createTemplateCode = options.templateCode ?? null;
  const createAdvancedMode = options.advancedMode ?? false;
  const createUniversalMode = options.universalMode ?? false;
  const selectedStoreId = options.selectedStoreId ?? null;
  const selectedStoreBusinessType = options.selectedStoreBusinessType ?? null;
  const { businessType: companyBusinessType } = useCompanyBusinessType();
  const effectiveBusinessType = resolveBusinessTypeForTemplates(
    selectedStoreBusinessType ?? companyBusinessType ?? 'UNIVERSAL'
  );
  const { data: businessConfig, isLoading: businessConfigLoading } = useBusinessConfig(effectiveBusinessType);
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

  const schema = useMemo(() => createProductCatalogFormSchema(t), [t]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultProductCatalogFormValues,
  });

  const { register, handleSubmit, reset, setValue, getValues, watch, formState: { errors } } = form;

  useEffect(() => {
    if (!isEdit) setEditAdvancedMode(false);
  }, [isEdit, product?.id]);

  useEffect(() => {
    if (isEdit || !templateLocked || !template) return;
    reset({
      ...defaultProductCatalogFormValues,
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

  useEffect(() => {
    if (!full?.attributes || !businessConfig?.fields?.length) return;
    for (const field of businessConfig.fields) {
      const value = full.attributes[field.fieldKey];
      if (value == null && field.fieldType !== 'BOOLEAN') continue;
      setValue(
        businessAttributeFieldName(field.fieldKey),
        attributeFormValue(value ?? '', field.fieldType)
      );
    }
  }, [full?.attributes, businessConfig?.fields, setValue]);

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

  const showSection = (section) =>
    resolveCatalogSectionVisible(section, {
      classicMode: advancedMode && !universalMode,
      universalMode,
      template,
      productType: productTypeWatch,
    });

  const onSubmit = (values) => {
    const base = buildProductCatalogPayload({
      values,
      storeRows,
      extraBarcodes,
      effectiveBusinessType,
      businessConfigFields: businessConfig?.fields,
      advancedMode,
      resolvedTemplateCode,
      showSection,
    });
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
    businessConfig,
    businessConfigLoading,
  };
}
