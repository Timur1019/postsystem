/**
 * Payload X/Z отчёта смены для ESC/POS.
 */
import i18n from '../../i18n/config';
import { APP_NAME } from '../../config/brand';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';

/**
 * @param {Function} t
 */
export function buildEscposShiftReportLabels(t) {
  return {
    xReportTitle: t('pos.xReport'),
    zReportTitle: t('pos.zReport'),
    openedAt: t('zReports.openedAt'),
    reportAt: t('pos.reportAt'),
    shiftSales: t('pos.shiftSales'),
    shiftTotal: t('pos.shiftTotal'),
    shiftCash: t('pos.shiftCash'),
    shiftCard: t('pos.shiftCard'),
    shiftVat: t('pos.shiftVat'),
    lineDiscountsSum: t('fiscalReceipt.lineDiscountsSum'),
    orderDiscountSum: t('fiscalReceipt.orderDiscountSum'),
    discountsSum: t('fiscalReceipt.discountsSum'),
    currency: t('fiscalReceipt.currency'),
  };
}

/**
 * @param {object} report
 * @param {Function} t
 */
export function buildEscposShiftReportPayload(report, t) {
  if (!report) return null;
  const appName = useTenantDisplayStore.getState().displayAppName?.() || APP_NAME;
  return {
    report,
    labels: buildEscposShiftReportLabels(t),
    locale: String(i18n.language || 'ru').split('-')[0],
    branding: { appName },
  };
}
