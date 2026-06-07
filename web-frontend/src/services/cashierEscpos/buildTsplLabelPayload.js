/**
 * Payload этикетки для TSPL (XP-365B по сети).
 */
import i18n from '../../i18n/config';
import { effectiveLabelFontScale } from '../../shelfLabelPrint/constants';
import { resolveAutoLabelLayout } from '../../shelfLabelPrint/resolveAutoLabelLayout';

/** @param {object} printJob @param {Function} t */
export function buildTsplLabelPayload(printJob, t) {
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
    padXmm: Number(auto?.padXmm ?? printJob.padXmm) || 0,
    padYmm: Number(auto?.padYmm ?? printJob.padYmm) || 0,
    offsetXmm: Number(auto?.offsetXmm ?? printJob.offsetXmm) || 0,
    offsetYmm: Number(auto?.offsetYmm ?? printJob.offsetYmm) || 0,
    fontScale: effectiveLabelFontScale(auto?.fontScale ?? printJob.fontScale),
    rotate180: Boolean(auto?.rotate180 ?? printJob.rotate180),
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
