/**
 * Автоматический размер бумаги и отступы для этикетки / ценника.
 * Подбирает компактный макет под содержимое (цена, название, штрихкод).
 */

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/**
 * @param {{
 *   variant?: 'label'|'priceTag',
 *   showName?: boolean,
 *   showBarcode?: boolean,
 *   showPrice?: boolean,
 *   productName?: string,
 *   price?: number|null,
 * }} input
 * @returns {{
 *   paperWmm: number,
 *   paperHmm: number,
 *   padXmm: number,
 *   padYmm: number,
 *   fontScale: number,
 *   rotate180: boolean,
 *   pageMarginMm: number,
 *   layoutMode: 'auto',
 * }}
 */
export function resolveAutoLabelLayout(input = {}) {
  const variant = input.variant === 'priceTag' ? 'priceTag' : 'label';
  const showName = input.showName !== false;
  const showBarcode = input.showBarcode !== false;
  const showPrice = input.showPrice !== false;
  const name = String(input.productName || '').trim();
  const nameLen = name.length;
  const hasPrice = input.price != null && !Number.isNaN(Number(input.price));

  if (variant === 'priceTag') {
    let paperWmm = 40;
    let paperHmm = 30;
    let padXmm = 2;
    let padYmm = 2;
    let fontScale = 1;

    const hasPriceBlock = showPrice && hasPrice;
    const hasNameBlock = showName && nameLen > 0;
    const hasBarcodeBlock = showBarcode;
    const blockCount = [hasPriceBlock, hasNameBlock, hasBarcodeBlock].filter(Boolean).length;

    if (blockCount === 1 && hasPriceBlock) {
      paperWmm = 30;
      paperHmm = 20;
      padXmm = 1.5;
      padYmm = 1.5;
      fontScale = 1.08;
    } else if (blockCount === 1 && hasBarcodeBlock) {
      paperWmm = 37.29;
      paperHmm = 25.93;
      padXmm = 2;
      padYmm = 2;
    } else if (hasPriceBlock && hasBarcodeBlock && !hasNameBlock) {
      paperWmm = 37.29;
      paperHmm = 25.93;
      padXmm = 2;
      padYmm = 2;
    } else if (nameLen > 48 || (blockCount === 3 && nameLen > 26)) {
      paperWmm = 40;
      paperHmm = 40;
      fontScale = 0.88;
      padXmm = 2.5;
      padYmm = 2.5;
    } else if (nameLen > 30) {
      paperHmm = 35;
      fontScale = 0.92;
    } else if (blockCount === 2 && hasNameBlock && hasPriceBlock && !hasBarcodeBlock) {
      paperWmm = 30;
      paperHmm = 25;
      padXmm = 2;
      padYmm = 2;
      fontScale = 0.98;
    }

    return {
      paperWmm,
      paperHmm,
      padXmm,
      padYmm,
      fontScale: clamp(fontScale, 0.82, 1.15),
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

  if (showBarcode && !showName && !showPrice) {
    paperWmm = 40;
    paperHmm = 30;
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

/**
 * @param {object} input
 */
export function mergeLabelInputWithAutoLayout(input) {
  const layout = resolveAutoLabelLayout(input);
  return { ...input, ...layout };
}
