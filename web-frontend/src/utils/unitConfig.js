/** Единицы учёта: кэш из GET /units + fallback до загрузки API. */

const WEIGHT_CATEGORIES = new Set(['MASS', 'VOLUME', 'LENGTH', 'AREA']);
const PIECE_CATEGORIES = new Set(['COUNT', 'TIME']);

const FALLBACK_CONFIG = {
  PCS: { label: 'шт', minQty: 1, step: 1, scale: 0, hasScale: false, category: 'COUNT' },
  KG: { label: 'кг', minQty: 0.001, step: 0.1, scale: 3, hasScale: true, category: 'MASS' },
  G: { label: 'г', minQty: 1, step: 1, scale: 0, hasScale: false, category: 'MASS' },
  L: { label: 'л', minQty: 0.001, step: 0.1, scale: 3, hasScale: false, category: 'VOLUME' },
  M: { label: 'м', minQty: 0.001, step: 0.1, scale: 3, hasScale: false, category: 'LENGTH' },
  MM: { label: 'мм', minQty: 1, step: 1, scale: 0, hasScale: false, category: 'LENGTH' },
  M2: { label: 'м²', minQty: 0.001, step: 0.1, scale: 3, hasScale: false, category: 'AREA' },
};

/** @type {Record<string, object>} */
let unitConfigByCode = { ...FALLBACK_CONFIG };

/** @type {Array<object>} */
let stockUnitsList = [];

/** @type {Array<object>} */
let receiptUnitsList = [];

/** @type {Array<object>} */
let conversionsList = [];

export function hydrateUnitsCatalog({ units = [], conversions = [] } = {}) {
  const next = { ...FALLBACK_CONFIG };
  const stock = [];
  const receipt = [];
  units.forEach((u) => {
    const row = {
      code: u.code,
      category: u.category,
      label: u.labelShortRu,
      labelRu: u.labelRu,
      minQty: Number(u.posMinQty),
      step: Number(u.posStep),
      scale: u.quantityScale,
      hasScale: u.allowFraction && WEIGHT_CATEGORIES.has(u.category),
      stockAllowed: u.stockAllowed,
      receiptOnly: u.receiptOnly,
    };
    next[u.code] = row;
    if (u.stockAllowed) stock.push(row);
    if (u.receiptOnly) receipt.push(row);
  });
  unitConfigByCode = next;
  stockUnitsList = stock;
  receiptUnitsList = receipt;
  conversionsList = conversions;
}

export function getStockUnits() {
  return stockUnitsList.length ? stockUnitsList : Object.values(unitConfigByCode);
}

export function getReceiptUnits() {
  return receiptUnitsList;
}

export function getUnitConversions() {
  return conversionsList;
}

export function stockUnitsForSaleType(saleType) {
  const units = getStockUnits();
  if (saleType === 'WEIGHT') {
    return units.filter((u) => WEIGHT_CATEGORIES.has(u.category));
  }
  if (saleType === 'SERVICE') {
    return units.filter((u) => u.category === 'COUNT' || u.category === 'TIME');
  }
  return units.filter((u) => PIECE_CATEGORIES.has(u.category) || u.code === 'PCS');
}

export const MEASURED_UNIT_CODES = ['KG', 'G', 'L', 'M', 'MM', 'M2', 'M3', 'ML', 'KM', 'CM'];

export const UNIT_DEFAULTS = {
  PCS: { unitOfMeasure: 'pcs', quantityScale: 0, allowFraction: false },
  KG: { unitOfMeasure: 'kg', quantityScale: 3, allowFraction: true },
  G: { unitOfMeasure: 'g', quantityScale: 0, allowFraction: true },
  L: { unitOfMeasure: 'l', quantityScale: 3, allowFraction: true },
  M: { unitOfMeasure: 'm', quantityScale: 3, allowFraction: true },
  MM: { unitOfMeasure: 'mm', quantityScale: 0, allowFraction: true },
  M2: { unitOfMeasure: 'm2', quantityScale: 3, allowFraction: true },
  M3: { unitOfMeasure: 'm3', quantityScale: 3, allowFraction: true },
  ML: { unitOfMeasure: 'ml', quantityScale: 0, allowFraction: true },
};

export function getUnitConfig(unitCode) {
  return unitConfigByCode[unitCode] || unitConfigByCode.KG || FALLBACK_CONFIG.KG;
}

export function unitLabel(unitCode) {
  return getUnitConfig(unitCode).label;
}

export function isMeasuredUnitCode(unitCode) {
  const cfg = getUnitConfig(unitCode);
  return WEIGHT_CATEGORIES.has(cfg.category);
}

export function isMeasuredProduct(product) {
  return product?.saleType === 'WEIGHT';
}

export function convertUnitQuantity(fromCode, toCode, quantity) {
  if (fromCode === toCode) return quantity;
  const n = Number(quantity);
  if (!Number.isFinite(n)) return quantity;
  const direct = conversionsList.find((c) => c.fromCode === fromCode && c.toCode === toCode);
  if (direct) return n * Number(direct.factor);
  const inverse = conversionsList.find((c) => c.fromCode === toCode && c.toCode === fromCode);
  if (inverse && Number(inverse.factor) !== 0) return n / Number(inverse.factor);
  return quantity;
}

const LABEL_TO_CODE = {
  pcs: 'PCS', kg: 'KG', g: 'G', l: 'L', m: 'M', mm: 'MM', m2: 'M2',
  кг: 'KG', г: 'G', л: 'L', м: 'M', мм: 'MM', 'м²': 'M2',
};

export function unitCodeFromLabel(label) {
  if (!label) return 'KG';
  return LABEL_TO_CODE[String(label).trim().toLowerCase()] || 'KG';
}
