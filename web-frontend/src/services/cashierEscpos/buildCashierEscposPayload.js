/**
 * Собирает JSON для main process (подписи с i18n, поля из tenant store).
 */
import { APP_NAME } from '../../config/brand';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';

/**
 * Карта включённых полей чека из tenant store.
 * @returns {Record<string, boolean>}
 */
function readReceiptFields() {
  const { receiptFields } = useTenantDisplayStore.getState().committed;
  const out = {};
  for (const [key, on] of Object.entries(receiptFields || {})) {
    out[key] = Boolean(on);
  }
  return out;
}

/**
 * Брендинг и env для шапки чека.
 * @returns {object}
 */
function readBranding() {
  const d = useTenantDisplayStore.getState().committed;
  return {
    companyName: d.receiptCompanyName || '',
    companyAddress: d.receiptCompanyAddress || '',
    companyPhone: d.receiptCompanyPhone || '',
    stir: d.receiptStir || '',
    logoDataUrl: d.receiptLogoDataUrl || null,
    qrBase: import.meta.env.VITE_FISCAL_QR_BASE?.trim() || '',
    virtualRegister:
      import.meta.env.VITE_VIRTUAL_REGISTER_ID || import.meta.env.VITE_REGISTER_NO || '1',
    fmNumber:
      import.meta.env.VITE_FISCAL_MODULE_NUMBER ||
      import.meta.env.VITE_FISCAL_CARD_ID ||
      '',
    shiftNo: import.meta.env.VITE_SHIFT_NO || '001',
  };
}

/**
 * Подписи строк чека (переводы с фронта — main без i18n).
 * @param {Function} t — react-i18next t
 * @returns {Record<string, string>}
 */
export function buildEscposLabels(t) {
  return {
    phoneLabel: t('fiscalReceipt.phoneLabel'),
    stir: t('fiscalReceipt.stir'),
    date: t('fiscalReceipt.date'),
    time: t('fiscalReceipt.time'),
    receiptNoShort: t('fiscalReceipt.receiptNoShort'),
    employee: t('fiscalReceipt.employee'),
    shift: t('fiscalReceipt.shift'),
    item: t('receipt.item'),
    qtyShort: t('receipt.qtyShort'),
    lineTotalShort: t('receipt.lineTotalShort'),
    ikpuLine: t('receipt.ikpuLine'),
    vatLineShort: t('fiscalReceipt.vatLineShort'),
    currency: t('fiscalReceipt.currency'),
    lineDiscountsSum: t('fiscalReceipt.lineDiscountsSum'),
    orderDiscountSum: t('fiscalReceipt.orderDiscountSum'),
    discountsSum: t('fiscalReceipt.discountsSum'),
    grandTotal: t('fiscalReceipt.grandTotal'),
    vatTotalLine: t('fiscalReceipt.vatTotalLine', { rate: '12' }),
    paymentForm: t('fiscalReceipt.paymentForm'),
    cash: t('fiscalReceipt.cash'),
    plastic: t('fiscalReceipt.plastic'),
    change: t('receipt.change'),
    fiscalSection: t('fiscalReceipt.fiscalSection'),
    virtualRegister: t('fiscalReceipt.virtualRegister'),
    fmNumber: t('fiscalReceipt.fmNumber'),
    fiscalReceiptNo: t('fiscalReceipt.fiscalReceiptNo'),
    fiscalSign: t('fiscalReceipt.fiscalSign'),
    footer: t('fiscalReceipt.footer'),
    qrHint: t('fiscalReceipt.qrHint'),
  };
}

/**
 * Полный payload для IPC desktop:print-receipt-escpos.
 * @param {object} sale — ответ POST /sales
 * @param {Function} t
 */
export function buildCashierEscposPayload(sale, t) {
  if (!sale) return null;

  const branding = readBranding();
  if (!branding.companyName) {
    branding.companyName =
      import.meta.env.VITE_COMPANY_NAME ||
      import.meta.env.VITE_STORE_BRAND ||
      APP_NAME;
  }
  if (!branding.companyAddress) {
    branding.companyAddress = t('fiscalReceipt.defaultAddress');
  }

  const shiftFromReceipt = String(sale.receiptNumber || '')
    .replace(/\D/g, '')
    .slice(-3)
    .padStart(3, '0');
  branding.shiftNo =
    import.meta.env.VITE_SHIFT_NO || shiftFromReceipt || branding.shiftNo || '001';

  return {
    sale,
    branding,
    receiptFields: readReceiptFields(),
    labels: buildEscposLabels(t),
    locale: t('common.locale', { defaultValue: 'ru' }),
  };
}
