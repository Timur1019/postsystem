/**
 * Payload этикетки для ESC/POS.
 */
import i18n from '../../i18n/config';
import { resolveAutoLabelLayout } from '../../utils/resolveAutoLabelLayout';

/**
 * @param {object} input
 * @param {Function} t
 */
export function buildEscposLabelPayload(input, t) {
  if (!input) return null;
  const {
    productName,
    barcode,
    price,
    variant,
    showName,
    showBarcode,
    showPrice,
    currency,
    copies,
    paperWmm,
    paperHmm,
    layoutMode,
  } = input;

  const auto =
    layoutMode === 'auto' || paperWmm == null || paperHmm == null
      ? resolveAutoLabelLayout({
          variant,
          showName,
          showBarcode,
          showPrice,
          productName,
          price,
        })
      : null;

  return {
    locale: String(i18n.language || 'ru').split('-')[0],
    copies: Math.min(999, Math.max(1, Number(copies) || 1)),
    paperWmm: Number(auto?.paperWmm ?? paperWmm) || 58,
    paperHmm: Number(auto?.paperHmm ?? paperHmm) || 40,
    labelsMeta: { currency: currency || t('fiscalReceipt.currency') },
    labels: [
      {
        productName: productName || '',
        barcode: barcode || '',
        price,
        variant: variant || 'label',
        showName: showName !== false,
        showBarcode: showBarcode !== false,
        showPrice: showPrice !== false,
        currency: currency || t('fiscalReceipt.currency'),
      },
    ],
  };
}
