/**
 * Единый реестр: тип бизнеса → шаблоны товаров.
 *
 * Чтобы добавить шаблон:
 * 1. Добавьте объект в PRODUCT_TEMPLATES (уникальный code).
 * 2. Укажите businessTypes — где показывать.
 * 3. Задайте defaults (productType, saleType, unitCode) и sections.
 * 4. Добавьте ключи в locales: productTemplates.<code>.title / .hint
 *
 * Чтобы убрать шаблон — удалите объект из PRODUCT_TEMPLATES
 * (или поставьте enabled: false).
 *
 * Секции формы (sections):
 * - tasnif, typeSelectors, construction, retailFlags, clothing, pharmacy, ownerVat, advancedUnits
 * - accounting, storePrices, barcodes
 */

import {
  Box,
  Car,
  Coffee,
  Droplets,
  LayoutGrid,
  Package,
  Pill,
  Ruler,
  Scale,
  Shirt,
  ShoppingBag,
  Snowflake,
  Tag,
  UtensilsCrossed,
  Wrench,
} from 'lucide-react';

/** @typedef {'CONSTRUCTION'|'GROCERY'|'CLOTHING'|'PHARMACY'|'CANTEEN'|'RESTAURANT'|'AUTO_PARTS'|'UNIVERSAL'} BusinessTypeCode */

/** @typedef {'tasnif'|'typeSelectors'|'construction'|'retailFlags'|'clothing'|'pharmacy'|'ownerVat'|'advancedUnits'|'accounting'|'storePrices'|'barcodes'} CatalogSection */

export const BUSINESS_TYPES = [
  {
    code: 'CONSTRUCTION',
    icon: Package,
    sort: 10,
    templateCodes: ['BULK', 'LENGTH', 'MM_LENGTH', 'LIQUID', 'TILE', 'PIECE_CONSTRUCTION', 'SERVICE'],
  },
  {
    code: 'GROCERY',
    icon: ShoppingBag,
    sort: 20,
    templateCodes: ['WEIGHT_GROCERY', 'PIECE_GROCERY', 'BEVERAGE', 'FROZEN', 'SERVICE'],
  },
  {
    code: 'CLOTHING',
    icon: Shirt,
    sort: 30,
    templateCodes: ['PIECE_CLOTHING', 'SERVICE'],
  },
  {
    code: 'PHARMACY',
    icon: Pill,
    sort: 40,
    templateCodes: ['PIECE_PHARMACY', 'WEIGHT_GROCERY', 'BEVERAGE', 'SERVICE'],
  },
  {
    code: 'CANTEEN',
    icon: UtensilsCrossed,
    sort: 50,
    templateCodes: ['WEIGHT_GROCERY', 'DISH', 'BEVERAGE', 'SERVICE'],
  },
  {
    code: 'RESTAURANT',
    icon: Coffee,
    sort: 60,
    templateCodes: ['DISH', 'BEVERAGE', 'PIECE_RETAIL', 'SERVICE'],
  },
  {
    code: 'AUTO_PARTS',
    icon: Car,
    sort: 70,
    templateCodes: ['PIECE_RETAIL', 'PIECE_CONSTRUCTION', 'LIQUID', 'SERVICE'],
  },
  {
    code: 'UNIVERSAL',
    icon: Box,
    sort: 99,
    templateCodes: null,
  },
];

const ALL_SECTIONS = [
  'tasnif',
  'typeSelectors',
  'construction',
  'retailFlags',
  'clothing',
  'pharmacy',
  'ownerVat',
  'advancedUnits',
  'accounting',
  'storePrices',
  'barcodes',
];

const WITH_STORES = ['accounting', 'storePrices'];
const RETAIL_PACK = ['accounting', 'storePrices', 'barcodes', 'retailFlags'];

/** @type {Array<object>} */
export const PRODUCT_TEMPLATES = [
  {
    code: 'BULK',
    icon: Package,
    sort: 10,
    businessTypes: ['CONSTRUCTION', 'UNIVERSAL'],
    enabled: true,
    defaults: {
      productType: 'MATERIAL',
      saleType: 'WEIGHT',
      unitCode: 'KG',
      quantityScale: 3,
      allowFraction: true,
      unitOfMeasure: 'kg',
      lowStockAlert: 10,
    },
    sections: WITH_STORES,
    constructionFields: [],
    priceLabelKey: 'productTemplates.pricePerKg',
    stockLabelKey: 'productTemplates.stockQty',
    stockHintKey: 'productTemplates.bulkStockHint',
  },
  {
    code: 'LENGTH',
    icon: Ruler,
    sort: 20,
    businessTypes: ['CONSTRUCTION', 'UNIVERSAL'],
    enabled: true,
    defaults: {
      productType: 'MATERIAL',
      saleType: 'WEIGHT',
      unitCode: 'M',
      quantityScale: 3,
      allowFraction: true,
      unitOfMeasure: 'm',
      lowStockAlert: 10,
      constructionAllowCutting: true,
    },
    sections: ['construction', ...WITH_STORES],
    constructionFields: ['standardLength', 'width', 'thickness', 'allowCutting'],
    priceLabelKey: 'productTemplates.pricePerMeter',
    stockLabelKey: 'productTemplates.stockMeters',
    stockHintKey: 'productTemplates.lengthStockHint',
  },
  {
    code: 'MM_LENGTH',
    icon: Ruler,
    sort: 25,
    businessTypes: ['CONSTRUCTION', 'UNIVERSAL'],
    enabled: true,
    defaults: {
      productType: 'MATERIAL',
      saleType: 'WEIGHT',
      unitCode: 'MM',
      quantityScale: 0,
      allowFraction: true,
      unitOfMeasure: 'mm',
      lowStockAlert: 100,
      constructionAllowCutting: true,
    },
    sections: ['construction', ...WITH_STORES],
    constructionFields: ['standardLength', 'allowCutting'],
    priceLabelKey: 'productTemplates.pricePerMm',
    stockLabelKey: 'productTemplates.stockMm',
    stockHintKey: 'productTemplates.mmLengthStockHint',
  },
  {
    code: 'LIQUID',
    icon: Droplets,
    sort: 30,
    businessTypes: ['CONSTRUCTION', 'AUTO_PARTS', 'UNIVERSAL'],
    enabled: true,
    defaults: {
      productType: 'MATERIAL',
      saleType: 'WEIGHT',
      unitCode: 'L',
      quantityScale: 3,
      allowFraction: true,
      unitOfMeasure: 'l',
      lowStockAlert: 5,
    },
    sections: WITH_STORES,
    constructionFields: [],
    priceLabelKey: 'productTemplates.pricePerLiter',
    stockLabelKey: 'productTemplates.stockLiters',
    stockHintKey: 'productTemplates.liquidStockHint',
  },
  {
    code: 'TILE',
    icon: LayoutGrid,
    sort: 32,
    businessTypes: ['CONSTRUCTION', 'UNIVERSAL'],
    enabled: true,
    defaults: {
      productType: 'MATERIAL',
      saleType: 'WEIGHT',
      unitCode: 'M2',
      quantityScale: 3,
      allowFraction: true,
      unitOfMeasure: 'm2',
      lowStockAlert: 10,
    },
    sections: ['construction', ...WITH_STORES],
    constructionFields: ['standardLength', 'width'],
    priceLabelKey: 'productTemplates.pricePerM2',
    stockLabelKey: 'productTemplates.stockM2',
    stockHintKey: 'productTemplates.tileStockHint',
  },
  {
    code: 'PIECE_CONSTRUCTION',
    icon: Box,
    sort: 40,
    businessTypes: ['CONSTRUCTION', 'AUTO_PARTS', 'UNIVERSAL'],
    enabled: true,
    defaults: {
      productType: 'MATERIAL',
      saleType: 'PIECE',
      unitCode: 'PCS',
      quantityScale: 0,
      allowFraction: false,
      unitOfMeasure: 'pcs',
      soldIndividually: true,
      lowStockAlert: 5,
    },
    sections: ['construction', ...WITH_STORES, 'barcodes'],
    constructionFields: ['standardLength'],
    priceLabelKey: 'productTemplates.pricePerPiece',
    stockLabelKey: 'productTemplates.stockPieces',
    stockHintKey: 'productTemplates.pieceConstructionHint',
  },
  {
    code: 'WEIGHT_GROCERY',
    icon: Scale,
    sort: 50,
    businessTypes: ['GROCERY', 'PHARMACY', 'CANTEEN', 'UNIVERSAL'],
    enabled: true,
    defaults: {
      productType: 'RETAIL',
      saleType: 'WEIGHT',
      unitCode: 'KG',
      quantityScale: 3,
      allowFraction: true,
      unitOfMeasure: 'kg',
      soldIndividually: true,
      lowStockAlert: 10,
    },
    sections: WITH_STORES,
    constructionFields: [],
    priceLabelKey: 'productTemplates.pricePerKg',
    stockLabelKey: 'productTemplates.stockQty',
    stockHintKey: 'productTemplates.weightGroceryHint',
  },
  {
    code: 'PIECE_GROCERY',
    icon: ShoppingBag,
    sort: 60,
    businessTypes: ['GROCERY', 'UNIVERSAL'],
    enabled: true,
    defaults: {
      productType: 'RETAIL',
      saleType: 'PIECE',
      unitCode: 'PCS',
      quantityScale: 0,
      allowFraction: false,
      unitOfMeasure: 'pcs',
      soldIndividually: true,
      markedProduct: false,
      lowStockAlert: 10,
    },
    sections: RETAIL_PACK,
    constructionFields: [],
    priceLabelKey: 'productTemplates.pricePerPiece',
    stockLabelKey: 'productTemplates.stockPieces',
  },
  {
    code: 'PIECE_PHARMACY',
    icon: Pill,
    sort: 65,
    businessTypes: ['PHARMACY', 'UNIVERSAL'],
    enabled: true,
    defaults: {
      productType: 'RETAIL',
      saleType: 'PIECE',
      unitCode: 'PCS',
      quantityScale: 0,
      allowFraction: false,
      unitOfMeasure: 'pcs',
      soldIndividually: true,
      markedProduct: false,
      lowStockAlert: 10,
      pharmacyExpiryRequired: true,
    },
    sections: [...RETAIL_PACK, 'pharmacy'],
    pharmacyFields: ['expiryRequired', 'prescriptionRequired', 'dosageForm'],
    constructionFields: [],
    priceLabelKey: 'productTemplates.pricePerPiece',
    stockLabelKey: 'productTemplates.stockPieces',
    stockHintKey: 'productTemplates.pharmacyStockHint',
  },
  {
    code: 'BEVERAGE',
    icon: Coffee,
    sort: 70,
    businessTypes: ['GROCERY', 'PHARMACY', 'CANTEEN', 'RESTAURANT', 'UNIVERSAL'],
    enabled: true,
    defaults: {
      productType: 'RETAIL',
      saleType: 'PIECE',
      unitCode: 'PCS',
      quantityScale: 0,
      allowFraction: false,
      unitOfMeasure: 'pcs',
      soldIndividually: true,
      lowStockAlert: 12,
    },
    sections: RETAIL_PACK,
    constructionFields: [],
    priceLabelKey: 'productTemplates.pricePerPiece',
    stockLabelKey: 'productTemplates.stockPieces',
  },
  {
    code: 'FROZEN',
    icon: Snowflake,
    sort: 80,
    businessTypes: ['GROCERY', 'UNIVERSAL'],
    enabled: true,
    defaults: {
      productType: 'RETAIL',
      saleType: 'WEIGHT',
      unitCode: 'KG',
      quantityScale: 3,
      allowFraction: true,
      unitOfMeasure: 'kg',
      soldIndividually: true,
      lowStockAlert: 5,
    },
    sections: WITH_STORES,
    constructionFields: [],
    priceLabelKey: 'productTemplates.pricePerKg',
    stockLabelKey: 'productTemplates.stockQty',
    stockHintKey: 'productTemplates.frozenHint',
  },
  {
    code: 'PIECE_RETAIL',
    icon: Tag,
    sort: 90,
    businessTypes: ['RESTAURANT', 'AUTO_PARTS', 'UNIVERSAL'],
    enabled: true,
    defaults: {
      productType: 'RETAIL',
      saleType: 'PIECE',
      unitCode: 'PCS',
      quantityScale: 0,
      allowFraction: false,
      unitOfMeasure: 'pcs',
      soldIndividually: true,
      markedProduct: false,
      lowStockAlert: 5,
    },
    sections: RETAIL_PACK,
    constructionFields: [],
    priceLabelKey: 'productTemplates.pricePerPiece',
    stockLabelKey: 'productTemplates.stockPieces',
  },
  {
    code: 'PIECE_CLOTHING',
    icon: Shirt,
    sort: 95,
    businessTypes: ['CLOTHING', 'UNIVERSAL'],
    enabled: true,
    defaults: {
      productType: 'RETAIL',
      saleType: 'PIECE',
      unitCode: 'PCS',
      quantityScale: 0,
      allowFraction: false,
      unitOfMeasure: 'pcs',
      soldIndividually: true,
      markedProduct: false,
      lowStockAlert: 5,
    },
    sections: [...RETAIL_PACK, 'clothing'],
    clothingFields: ['sizeRange', 'color', 'gender'],
    constructionFields: [],
    priceLabelKey: 'productTemplates.pricePerPiece',
    stockLabelKey: 'productTemplates.stockPieces',
  },
  {
    code: 'DISH',
    icon: UtensilsCrossed,
    sort: 100,
    businessTypes: ['CANTEEN', 'RESTAURANT', 'UNIVERSAL'],
    enabled: true,
    defaults: {
      productType: 'DISH',
      saleType: 'PIECE',
      unitCode: 'PCS',
      quantityScale: 0,
      allowFraction: false,
      unitOfMeasure: 'pcs',
      soldIndividually: true,
      lowStockAlert: 0,
      initialStock: 0,
    },
    sections: ['accounting', 'storePrices'],
    constructionFields: [],
    priceLabelKey: 'productTemplates.pricePerPortion',
    stockLabelKey: 'productTemplates.stockPieces',
    stockHintKey: 'productTemplates.dishStockHint',
    hideStock: true,
  },
  {
    code: 'SERVICE',
    icon: Wrench,
    sort: 110,
    businessTypes: [
      'CONSTRUCTION',
      'GROCERY',
      'CLOTHING',
      'PHARMACY',
      'CANTEEN',
      'RESTAURANT',
      'AUTO_PARTS',
      'UNIVERSAL',
    ],
    enabled: true,
    defaults: {
      productType: 'SERVICE',
      saleType: 'SERVICE',
      unitCode: 'PCS',
      quantityScale: 0,
      allowFraction: false,
      unitOfMeasure: 'pcs',
      soldIndividually: true,
      lowStockAlert: 0,
      initialStock: 0,
    },
    sections: ['accounting', 'storePrices'],
    constructionFields: [],
    priceLabelKey: 'productTemplates.pricePerService',
    hideStock: true,
    hideCost: true,
  },
];

const templateByCode = new Map(
  PRODUCT_TEMPLATES.filter((t) => t.enabled !== false).map((t) => [t.code, t])
);

const businessByCode = new Map(BUSINESS_TYPES.map((b) => [b.code, b]));

export function getBusinessType(code) {
  return businessByCode.get(code) ?? businessByCode.get('UNIVERSAL');
}

export function getProductTemplate(code) {
  if (!code) return null;
  return templateByCode.get(code) ?? null;
}

export function listEnabledTemplates() {
  return [...templateByCode.values()].sort((a, b) => a.sort - b.sort);
}

export function listTemplatesForBusinessType(businessTypeCode) {
  const bt = getBusinessType(businessTypeCode);
  if (!bt || bt.templateCodes == null) {
    return listEnabledTemplates();
  }
  return bt.templateCodes
    .map((code) => templateByCode.get(code))
    .filter(Boolean);
}

export function templateHasSection(template, section) {
  if (!template) return true;
  return (template.sections ?? ALL_SECTIONS).includes(section);
}

export function templateShowsConstructionField(template, field) {
  if (!template) return true;
  if (!templateHasSection(template, 'construction')) return false;
  const fields = template.constructionFields;
  if (!fields || fields.length === 0) return false;
  return fields.includes(field);
}

export function templateShowsClothingField(template, field) {
  if (!template) return true;
  if (!templateHasSection(template, 'clothing')) return false;
  return (template.clothingFields ?? []).includes(field);
}

export function templateShowsPharmacyField(template, field) {
  if (!template) return true;
  if (!templateHasSection(template, 'pharmacy')) return false;
  return (template.pharmacyFields ?? []).includes(field);
}

export function applyTemplateDefaults(template) {
  if (!template?.defaults) return {};
  return { ...template.defaults };
}

export function getProductTemplateTitle(t, product) {
  const code = resolveProductTemplateCode(product);
  if (!code) return null;
  const key = `productTemplates.${code}.title`;
  const label = t(key);
  return label === key ? code : label;
}

export function resolveProductTemplateCode(product) {
  if (!product) return null;
  if (product.templateCode) return product.templateCode;
  return inferTemplateCodeFromProduct(product);
}

export function inferTemplateCodeFromProduct(product) {
  if (!product) return null;
  const type = product.productType;
  const sale = product.saleType;
  const unit = product.unitCode;

  if (type === 'SERVICE' || sale === 'SERVICE') return 'SERVICE';
  if (type === 'DISH') return 'DISH';
  if (type === 'MATERIAL' && sale === 'WEIGHT' && unit === 'KG') return 'BULK';
  if (type === 'MATERIAL' && sale === 'WEIGHT' && unit === 'M') return 'LENGTH';
  if (type === 'MATERIAL' && sale === 'WEIGHT' && unit === 'MM') return 'MM_LENGTH';
  if (type === 'MATERIAL' && sale === 'WEIGHT' && unit === 'L') return 'LIQUID';
  if (type === 'MATERIAL' && sale === 'WEIGHT' && unit === 'M2') return 'TILE';
  if (type === 'MATERIAL' && sale === 'PIECE') return 'PIECE_CONSTRUCTION';
  if (type === 'RETAIL' && sale === 'WEIGHT' && unit === 'KG') return 'WEIGHT_GROCERY';
  if (type === 'RETAIL' && sale === 'PIECE') {
    if (product.retailExtras?.pharmacyDosageForm || product.retailExtras?.pharmacyExpiryRequired) {
      return 'PIECE_PHARMACY';
    }
    if (product.retailExtras?.clothingSizeRange || product.retailExtras?.clothingGender) {
      return 'PIECE_CLOTHING';
    }
    return 'PIECE_RETAIL';
  }
  return null;
}
