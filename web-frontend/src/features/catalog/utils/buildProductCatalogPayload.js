import { buildStorePrices } from '../../../utils/productCatalogPrices';
import { buildAttributesPayload } from './productCatalogFormDefaults';

function buildRetailExtrasPayload(values, showSection) {
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
}

export function buildProductCatalogPayload({
  values,
  storeRows,
  extraBarcodes,
  effectiveBusinessType,
  businessConfigFields,
  advancedMode,
  resolvedTemplateCode,
  showSection,
}) {
  const storePrices = buildStorePrices(storeRows, values.sellingPrice);
  const additionalBarcodes = extraBarcodes.map((b) => b.trim()).filter(Boolean);

  return {
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
    retailExtras: buildRetailExtrasPayload(values, showSection),
    businessTypeCode: effectiveBusinessType,
    attributes: buildAttributesPayload(values, businessConfigFields),
    storePrices,
    additionalBarcodes,
    templateCode: advancedMode ? null : (resolvedTemplateCode || null),
  };
}
