/**
 * Payload Z-отчёта для ESC/POS.
 */
import i18n from '../../i18n/config';

/**
 * @param {Function} t
 */
export function buildEscposZReportLabels(t) {
  return {
    zReportTitle: t('pos.zReport'),
    terminalSerial: t('zReports.printTerminalSerial'),
    appletVer: t('zReports.printAppletVer'),
    employee: t('zReports.printEmployee'),
    storeName: t('zReports.printStoreName'),
    fiscalCard: t('cashRegisters.colFiscal'),
    zNumber: t('zReports.printZNumber'),
    sectionSale: t('zReports.sectionSale'),
    saleCash: t('zReports.saleCash'),
    saleCard: t('zReports.saleCard'),
    saleHumo: t('zReports.saleHumo'),
    saleUzcard: t('zReports.saleUzcard'),
    saleCashless: t('zReports.saleCashless'),
    saleVat: t('zReports.saleVat'),
    saleCount: t('zReports.saleCount'),
    lineDiscountsSum: t('fiscalReceipt.lineDiscountsSum'),
    orderDiscountSum: t('fiscalReceipt.orderDiscountSum'),
    discountsSum: t('fiscalReceipt.discountsSum'),
    sectionReturn: t('zReports.sectionReturn'),
    returnCash: t('zReports.returnCash'),
    returnCard: t('zReports.returnCard'),
    returnHumo: t('zReports.returnHumo'),
    returnUzcard: t('zReports.returnUzcard'),
    returnCashless: t('zReports.returnCashless'),
    returnVat: t('zReports.returnVat'),
    returnCount: t('zReports.returnCount'),
    openedAt: t('zReports.openedAt'),
    closedAt: t('zReports.closedAt'),
    firstReceipt: t('zReports.firstReceipt'),
    lastReceipt: t('zReports.lastReceipt'),
    grandTotal: t('zReports.grandTotal'),
    currency: t('fiscalReceipt.currency'),
  };
}

/**
 * @param {object} z
 * @param {Function} t
 */
export function buildEscposZReportPayload(z, t) {
  if (!z) return null;
  return {
    z,
    labels: buildEscposZReportLabels(t),
    locale: String(i18n.language || 'ru').split('-')[0],
    branding: { appName: z.brandName || 'Aurent' },
  };
}
