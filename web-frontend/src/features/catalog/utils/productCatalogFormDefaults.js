import { businessAttributeFieldName } from '../components/products/catalog/ProductCatalogDynamicFieldsSection';

export const defaultProductCatalogFormValues = {
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

export function attributeFormValue(value, fieldType) {
  if (fieldType === 'BOOLEAN') return value === 'true' || value === true;
  return value ?? '';
}

export function buildAttributesPayload(values, fields) {
  if (!fields?.length) return undefined;
  const attrs = {};
  for (const field of fields) {
    if (field.enabled === false) continue;
    const raw = values[businessAttributeFieldName(field.fieldKey)];
    if (field.fieldType === 'BOOLEAN') {
      attrs[field.fieldKey] = raw ? 'true' : '';
      continue;
    }
    const text = raw == null ? '' : String(raw).trim();
    attrs[field.fieldKey] = text;
  }
  return attrs;
}
