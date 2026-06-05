import { resolveAutoLabelLayout } from './resolveAutoLabelLayout';

/**
 * Единый payload для предпросмотра и будущей печати (ESC/POS, silent HTML, и т.д.).
 * @param {{
 *   productName?: string,
 *   barcode?: string,
 *   price?: number|null,
 *   variant?: 'label'|'priceTag',
 *   showName?: boolean,
 *   showBarcode?: boolean,
 *   showPrice?: boolean,
 *   copies?: number,
 *   layout?: import('./constants').ShelfLabelLayoutSettings | null,
 *   layoutMode?: 'auto'|'manual',
 *   currency?: string,
 * }} input
 */
export function buildLabelPrintJob(input) {
  const variant = input.variant === 'priceTag' ? 'priceTag' : 'label';
  const showName = input.showName !== false;
  const showBarcode = input.showBarcode !== false;
  const showPrice = input.showPrice !== false;
  const copies = Math.min(999, Math.max(1, Math.trunc(Number(input.copies) || 1)));

  const layout =
    input.layoutMode === 'auto' || input.layout?.layoutMode === 'auto'
      ? resolveAutoLabelLayout({
          variant,
          showName,
          showBarcode,
          showPrice,
          productName: input.productName,
          barcode: input.barcode,
          price: input.price,
        })
      : { layoutMode: 'manual', ...input.layout };

  return {
    productName: String(input.productName || ''),
    barcode: String(input.barcode || ''),
    price: input.price,
    variant,
    showName,
    showBarcode,
    showPrice,
    copies,
    currency: input.currency || '',
    layoutMode: layout.layoutMode || 'manual',
    rotate180: Boolean(layout.rotate180),
    fontScale: Number(layout.fontScale) || 1,
    padXmm: Number(layout.padXmm) || 0,
    padYmm: Number(layout.padYmm) || 0,
    offsetXmm: Number(layout.offsetXmm) || 0,
    offsetYmm: Number(layout.offsetYmm) || 0,
    paperWmm: Number(layout.paperWmm) || 58,
    paperHmm: Number(layout.paperHmm) || 40,
    pageMarginMm: Number(layout.pageMarginMm) || 0,
  };
}
