/**
 * Payload этикетки для ESC/POS (как чек / Z / X).
 */
import i18n from '../../i18n/config';
import { resolveAutoLabelLayout } from '../../shelfLabelPrint/resolveAutoLabelLayout';

/** @param {object} printJob — результат buildLabelPrintJob @param {Function} t */
export function buildEscposLabelPayload(printJob, t) {
  if (!printJob) return null;

  const auto =
    printJob.layoutMode === 'auto'
      ? resolveAutoLabelLayout({
          variant: printJob.variant,
          showName: printJob.showName,
          showBarcode: printJob.showBarcode,
          showPrice: printJob.showPrice,
          productName: printJob.productName,
          barcode: printJob.barcode,
          price: printJob.price,
        })
      : null;

  const currency = printJob.currency || t('fiscalReceipt.currency');

  return {
    locale: String(i18n.language || 'ru').split('-')[0],
    copies: Math.min(999, Math.max(1, Number(printJob.copies) || 1)),
    paperWmm: Number(auto?.paperWmm ?? printJob.paperWmm) || 58,
    paperHmm: Number(auto?.paperHmm ?? printJob.paperHmm) || 40,
    labelsMeta: { currency },
    labels: [
      {
        productName: printJob.productName || '',
        barcode: printJob.barcode || '',
        price: printJob.price,
        variant: printJob.variant || 'label',
        showName: printJob.showName !== false,
        showBarcode: printJob.showBarcode !== false,
        showPrice: printJob.showPrice !== false,
        currency,
      },
    ],
  };
}
