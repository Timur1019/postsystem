/**
 * Автоматический размер бумаги и отступы для этикетки / ценника.
 * Подбирает минимальный размер, на котором помещаются включённые блоки.
 * @param {{
 *   variant?: 'label'|'priceTag',
 *   showName?: boolean,
 *   showBarcode?: boolean,
 *   showPrice?: boolean,
 *   productName?: string,
 *   barcode?: string,
 *   price?: number|null,
 * }} input
 * @returns {import('./constants').ShelfLabelLayoutSettings}
 */
export function resolveAutoLabelLayout(input = {}) {
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const variant = input.variant === 'priceTag' ? 'priceTag' : 'label';
  const showName = input.showName !== false;
  const showBarcode = input.showBarcode !== false;
  const showPrice = input.showPrice !== false;
  const name = String(input.productName || '').trim();
  const nameLen = name.length;
  const hasBarcode = Boolean(String(input.barcode || '').trim());
  const hasPrice = input.price != null && !Number.isNaN(Number(input.price));

  if (variant === 'priceTag') {
    const hasPriceBlock = showPrice && hasPrice;
    const hasNameBlock = showName && nameLen > 0;
    const hasBarcodeBlock = showBarcode && hasBarcode;
    const blockCount = [hasPriceBlock, hasNameBlock, hasBarcodeBlock].filter(Boolean).length;

    /** @type {Array<{ paperWmm: number, paperHmm: number, padXmm: number, padYmm: number, fontScale: number }>} */
    const candidates = [];

    if (blockCount === 1 && hasPriceBlock) {
      candidates.push({ paperWmm: 30, paperHmm: 20, padXmm: 1.5, padYmm: 1.5, fontScale: 1.08 });
    } else if (blockCount === 1 && hasBarcodeBlock) {
      candidates.push({ paperWmm: 37.29, paperHmm: 25.93, padXmm: 2, padYmm: 2, fontScale: 1 });
    } else if (hasPriceBlock && hasBarcodeBlock && !hasNameBlock) {
      candidates.push({ paperWmm: 37.29, paperHmm: 25.93, padXmm: 2, padYmm: 2, fontScale: 1 });
    } else if (blockCount === 2 && hasNameBlock && hasPriceBlock && !hasBarcodeBlock) {
      candidates.push({ paperWmm: 30, paperHmm: 25, padXmm: 2, padYmm: 2, fontScale: 0.98 });
    } else {
      // Цена + название + штрихкод — от самого компактного к более крупному
      if (nameLen <= 22) {
        candidates.push({ paperWmm: 37.29, paperHmm: 25.93, padXmm: 2, padYmm: 2, fontScale: 0.92 });
      }
      if (nameLen <= 34) {
        candidates.push({ paperWmm: 40, paperHmm: 30, padXmm: 2, padYmm: 2, fontScale: 0.94 });
      }
      if (nameLen <= 44) {
        candidates.push({ paperWmm: 43, paperHmm: 25, padXmm: 2, padYmm: 2, fontScale: 0.9 });
      }
      if (nameLen <= 54) {
        candidates.push({ paperWmm: 40, paperHmm: 35, padXmm: 2.5, padYmm: 2.5, fontScale: 0.88 });
      }
      candidates.push({ paperWmm: 40, paperHmm: 40, padXmm: 2.5, padYmm: 2.5, fontScale: 0.85 });
    }

    const pick = candidates[0] || { paperWmm: 40, paperHmm: 30, padXmm: 2, padYmm: 2, fontScale: 0.94 };

    return {
      paperWmm: pick.paperWmm,
      paperHmm: pick.paperHmm,
      padXmm: pick.padXmm,
      padYmm: pick.padYmm,
      fontScale: clamp(pick.fontScale, 0.82, 1.15),
      rotate180: false,
      pageMarginMm: 0,
      layoutMode: 'auto',
    };
  }

  let paperWmm = 58;
  let paperHmm = 40;
  let padXmm = 3;
  let padYmm = 3;
  let fontScale = 1;

  if (showBarcode && hasBarcode && !showName && !showPrice) {
    paperWmm = 37.29;
    paperHmm = 25.93;
    padXmm = 2;
    padYmm = 2;
  } else if (showBarcode && hasBarcode && showName && !showPrice && nameLen <= 28) {
    paperWmm = 40;
    paperHmm = 30;
    padXmm = 2;
    padYmm = 2;
    fontScale = 0.95;
  } else if (nameLen > 55) {
    paperHmm = 50;
    fontScale = 0.9;
  } else if (nameLen > 35) {
    paperHmm = 45;
    fontScale = 0.95;
  }

  return {
    paperWmm,
    paperHmm,
    padXmm,
    padYmm,
    fontScale: clamp(fontScale, 0.85, 1.1),
    rotate180: false,
    pageMarginMm: 0,
    layoutMode: 'auto',
  };
}

export function mergeLabelInputWithAutoLayout(input) {
  return { ...input, ...resolveAutoLabelLayout(input) };
}
