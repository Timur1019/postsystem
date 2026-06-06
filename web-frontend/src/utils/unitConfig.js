/** Единицы учёта количества: подписи, точность, шаги для кассы. */

export const MEASURED_UNIT_CODES = ['KG', 'G', 'L', 'M', 'MM'];

const UNIT_CONFIG = {
  PCS: { label: 'шт', minQty: 1, step: 1, scale: 0, hasScale: false },
  KG: { label: 'кг', minQty: 0.001, step: 0.1, scale: 3, hasScale: true },
  G: { label: 'г', minQty: 1, step: 1, scale: 0, hasScale: false },
  L: { label: 'л', minQty: 0.001, step: 0.1, scale: 3, hasScale: false },
  M: { label: 'м', minQty: 0.001, step: 0.1, scale: 3, hasScale: false },
  MM: { label: 'мм', minQty: 1, step: 1, scale: 0, hasScale: false },
};

export const UNIT_DEFAULTS = {
  PCS: { unitOfMeasure: 'pcs', quantityScale: 0, allowFraction: false },
  KG: { unitOfMeasure: 'kg', quantityScale: 3, allowFraction: true },
  G: { unitOfMeasure: 'g', quantityScale: 0, allowFraction: true },
  L: { unitOfMeasure: 'l', quantityScale: 3, allowFraction: true },
  M: { unitOfMeasure: 'm', quantityScale: 3, allowFraction: true },
  MM: { unitOfMeasure: 'mm', quantityScale: 0, allowFraction: true },
};

export function getUnitConfig(unitCode) {
  return UNIT_CONFIG[unitCode] || UNIT_CONFIG.KG;
}

export function unitLabel(unitCode) {
  return getUnitConfig(unitCode).label;
}

export function isMeasuredUnitCode(unitCode) {
  return MEASURED_UNIT_CODES.includes(unitCode);
}

export function isMeasuredProduct(product) {
  return product?.saleType === 'WEIGHT';
}

const LABEL_TO_CODE = {
  pcs: 'PCS',
  kg: 'KG',
  g: 'G',
  l: 'L',
  m: 'M',
  mm: 'MM',
  кг: 'KG',
  г: 'G',
  л: 'L',
  м: 'M',
  мм: 'MM',
};

export function unitCodeFromLabel(label) {
  if (!label) return 'KG';
  return LABEL_TO_CODE[String(label).trim().toLowerCase()] || 'KG';
}
