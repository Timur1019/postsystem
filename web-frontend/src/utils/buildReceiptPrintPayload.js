import QRCode from 'qrcode';
import { RECEIPT_PRINT_DOM } from '../config/receiptPrintConfig';
import { useTenantDisplayStore } from '../store/tenantDisplayStore';
import { buildQrPayload } from './fiscalReceiptFormat';

function readTenantBranding() {
  const { committed } = useTenantDisplayStore.getState();
  const d = committed;
  return {
    companyName: d.receiptCompanyName || '',
    companyAddress: d.receiptCompanyAddress || '',
    stir: d.receiptStir || '',
    logoDataUrl: d.receiptLogoDataUrl || null,
  };
}

function qrFromDom() {
  const host = document.getElementById(RECEIPT_PRINT_DOM.bodyPrintHostId);
  const img = host?.querySelector(RECEIPT_PRINT_DOM.qrImageSelector);
  if (img?.src?.startsWith('data:') && img.complete && img.naturalWidth > 0) {
    return img.src;
  }
  return null;
}

async function qrFromSale(sale) {
  const value = buildQrPayload(sale);
  if (!value) return null;
  try {
    return await QRCode.toDataURL(value, {
      width: 120,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    });
  } catch {
    return null;
  }
}

/**
 * JSON для Electron: белый HTML-чек без захвата тёмного UI кассы.
 * @param {object} sale — snapshot POST /sales
 */
export async function buildReceiptPrintPayload(sale) {
  if (!sale) return null;
  const qrDataUrl = qrFromDom() || (await qrFromSale(sale));
  return {
    sale: { ...sale, qrDataUrl: qrDataUrl || null },
    branding: readTenantBranding(),
  };
}
