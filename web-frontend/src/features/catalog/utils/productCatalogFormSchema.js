import { z } from 'zod';

export function createProductCatalogFormSchema(t) {
  return z.object({
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
  });
}
