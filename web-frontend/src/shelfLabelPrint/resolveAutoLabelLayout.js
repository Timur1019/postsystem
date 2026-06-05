import { DEFAULT_PRESET_ID, getLabelPresetById, layoutFromPreset } from './constants';

/**
 * Автоматический размер бумаги — только из справочника стандартных рулонов.
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

  const hasPriceBlock = showPrice && hasPrice;
  const hasNameBlock = showName && nameLen > 0;
  const hasBarcodeBlock = showBarcode && hasBarcode;
  const blockCount = [hasPriceBlock, hasNameBlock, hasBarcodeBlock].filter(Boolean).length;

  /** @type {string[]} */
  const presetIds = [];

  if (variant === 'priceTag') {
    if (blockCount === 1 && hasPriceBlock) {
      presetIds.push('micro_30_20');
    } else if (blockCount === 1 && hasBarcodeBlock) {
      presetIds.push('ean_nominal');
    } else if (hasPriceBlock && hasBarcodeBlock && !hasNameBlock) {
      presetIds.push('ean_nominal', 'micro_43_25');
    } else if (blockCount === 2 && hasNameBlock && hasPriceBlock && !hasBarcodeBlock) {
      presetIds.push('micro_43_25', 'micro_30_20');
    } else {
      if (nameLen <= 22) presetIds.push('ean_nominal');
      if (nameLen <= 34) presetIds.push('micro_43_25');
      if (nameLen <= 44) presetIds.push('standard_58_30');
      if (nameLen <= 54) presetIds.push('standard_58_40');
      presetIds.push('standard_58_60');
    }
  } else {
    if (hasBarcodeBlock && !hasNameBlock && !hasPriceBlock) {
      presetIds.push('ean_nominal', 'micro_30_20');
    } else if (hasBarcodeBlock && hasNameBlock && !hasPriceBlock && nameLen <= 28) {
      presetIds.push('micro_43_25', 'standard_58_30');
    } else if (nameLen > 55) {
      presetIds.push('standard_58_60', 'large_74_45');
    } else if (nameLen > 35) {
      presetIds.push('standard_58_40', 'standard_58_60');
    } else {
      presetIds.push('standard_58_40', 'standard_58_30');
    }
  }

  const presetId = presetIds.find((id) => getLabelPresetById(id)) || DEFAULT_PRESET_ID;
  const preset = getLabelPresetById(presetId);

  return {
    ...layoutFromPreset(presetId),
    fontScale: clamp(preset?.fontScale ?? 1, 0.82, 1.15),
    layoutMode: 'auto',
  };
}

export function mergeLabelInputWithAutoLayout(input) {
  return { ...input, ...resolveAutoLabelLayout(input) };
}
