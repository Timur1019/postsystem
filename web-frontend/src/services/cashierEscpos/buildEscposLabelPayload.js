/**
 * Payload этикетки для ESC/POS.
 */
import i18n from '../../i18n/config';

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
  } = input;

  return {
    locale: String(i18n.language || 'ru').split('-')[0],
    copies: Math.min(999, Math.max(1, Number(copies) || 1)),
    paperWmm: Number(paperWmm) || 58,
    paperHmm: Number(paperHmm) || 40,
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
