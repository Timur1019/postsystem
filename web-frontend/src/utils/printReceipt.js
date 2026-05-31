import {
  prepareThermalPrint,
  printWithHtmlClass,
  PRINT_THERMAL_CLASS,
  PRINT_THERMAL_MODAL_CLASS,
  ELECTRON_SILENT_PRINT_CLASS,
} from './printWithHtmlClass';
import { useTenantDisplayStore } from '../store/tenantDisplayStore';

/** Классы, которые Electron вешает на <html> при тихой печати — снимаем, иначе белый экран. */
const DESKTOP_PRINT_HTML_CLASSES = [
  PRINT_THERMAL_CLASS,
  PRINT_THERMAL_MODAL_CLASS,
  ELECTRON_SILENT_PRINT_CLASS,
];

/** Десктоп-оболочка Electron (не веб-браузер). */
export function isDesktopCashier() {
  return typeof window !== 'undefined' && Boolean(window.desktopCashier?.isDesktop);
}

/** Тихая печать через скрытое окно Electron (не printCurrentPage с главного экрана). */
export function isDesktopSilentPrintAvailable() {
  return (
    isDesktopCashier() &&
    (typeof window.desktopCashier?.printReceiptSale === 'function' ||
      typeof window.desktopCashier?.printShiftReport === 'function' ||
      typeof window.desktopCashier?.printReceipt === 'function' ||
      typeof window.desktopCashier?.printReceiptHtml === 'function')
  );
}

export function cleanupDesktopPrintState() {
  if (typeof document === 'undefined') return;
  DESKTOP_PRINT_HTML_CLASSES.forEach((c) => document.documentElement.classList.remove(c));
  document.getElementById('pos-print-job-page')?.remove();
}

function receiptPrintElement() {
  return (
    document.getElementById('receipt-print-area') ||
    document.getElementById('fiscal-print-shell')
  );
}

function isOnReceiptPage() {
  return Boolean(receiptPrintElement());
}

/** JSON продажи + брендинг для Electron printReceiptSale (без React/Tailwind). */
export function buildDesktopSalePrintPayload(sale, qrDataUrl = null) {
  if (!sale?.receiptNumber) return null;
  const td = useTenantDisplayStore.getState();
  return {
    ...sale,
    qrDataUrl: qrDataUrl || sale.qrDataUrl || null,
    _branding: {
      companyName: td.receiptCompanyName || sale.storeName || undefined,
      companyAddress: td.receiptCompanyAddress || undefined,
      stir: td.receiptStir || undefined,
      logoDataUrl: td.receiptLogoDataUrl || undefined,
    },
  };
}

/** X/Z-отчёт смены для Electron printShiftReport. */
export function buildDesktopShiftPrintPayload(report, t) {
  if (!report?.reportType) return null;
  const td = useTenantDisplayStore.getState();
  return {
    ...report,
    _branding: {
      companyName: td.receiptCompanyName || td.displayAppName?.() || undefined,
    },
    _labels: {
      xReport: t('pos.xReport'),
      zReport: t('pos.zReport'),
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
    },
  };
}

/** Печать X/Z-отчёта на десктопе через скрытое окно Electron. */
export async function printDesktopShiftReport(report, t) {
  if (!isDesktopCashier() || !report?.reportType) {
    return { ok: false };
  }
  if (typeof window.desktopCashier?.printShiftReport !== 'function') {
    return { ok: false };
  }
  const payload = buildDesktopShiftPrintPayload(report, t);
  if (!payload) return { ok: false };
  try {
    const result = await window.desktopCashier.printShiftReport(payload);
    return { ok: true, mode: result?.mode || 'silent' };
  } catch (err) {
    throw err;
  }
}

/** Печать чека на десктопе: Electron собирает HTML из JSON продажи. */
export async function printDesktopReceiptSale(sale, { qrDataUrl = null, autoPrint = false } = {}) {
  if (!isDesktopCashier() || !sale?.receiptNumber) {
    return { ok: false };
  }
  const payload = buildDesktopSalePrintPayload(
    sale,
    qrDataUrl ?? captureReceiptQrDataUrl()
  );
  if (!payload) {
    return { ok: false };
  }
  const invokeOpts = { autoPrint: Boolean(autoPrint) };
  try {
    const result = await window.desktopCashier.printReceiptSale(payload, invokeOpts);
    return { ok: true, mode: result?.mode || 'silent' };
  } catch (err) {
    if (typeof window.desktopCashier?.printReceiptSaleDialog === 'function') {
      await window.desktopCashier.printReceiptSaleDialog(payload);
      return { ok: true, mode: 'dialog' };
    }
    throw err;
  }
}

function captureReceiptHtml() {
  const area =
    document.querySelector('#fiscal-print-shell #receipt-print-area') ||
    document.getElementById('receipt-print-area');
  if (!area) return '';
  const textLen = (area.innerText || '').trim().length;
  if (textLen < 40) return '';
  return area.outerHTML;
}

function captureReceiptQrDataUrl() {
  const img =
    document.querySelector('#pos-sale-print-shell .receipt-qr') ||
    document.querySelector('#fiscal-print-shell .receipt-qr') ||
    document.querySelector('#receipt-print-area .receipt-qr');
  if (img?.complete && img.naturalWidth > 0 && img.src) {
    return img.src;
  }
  return null;
}

async function waitForReceiptDomReady() {
  await document.fonts?.ready;
  for (let i = 0; i < 50; i += 1) {
    await new Promise((r) => setTimeout(r, 100));
    const area = receiptPrintElement();
    if (!area) continue;
    const textLen = (area.innerText || '').trim().length;
    const h = Math.max(area.scrollHeight, area.offsetHeight, area.getBoundingClientRect().height);
    const imgsReady = Array.from(document.images).every((img) => img.complete);
    if (textLen >= 80 && h >= 120 && imgsReady) {
      return;
    }
  }
}

/**
 * Диалог печати (запасной путь — как в браузере, window.print).
 * @returns {Promise<'dialog'>}
 */
export async function printThermalReceiptDialog({ useModalShell = false } = {}) {
  const classes = useModalShell
    ? [PRINT_THERMAL_CLASS, PRINT_THERMAL_MODAL_CLASS]
    : [PRINT_THERMAL_CLASS];
  await waitForReceiptDomReady();
  const cleanup = prepareThermalPrint(classes);
  return new Promise((resolve) => {
    const done = () => {
      cleanup();
      window.removeEventListener('afterprint', done);
      resolve('dialog');
    };
    window.addEventListener('afterprint', done);
    requestAnimationFrame(() => window.print());
  });
}

/**
 * Тихая печать: скрытое окно (HTML или /receipt), при сбое — диалог Windows.
 * @param {{ useModalShell?: boolean, receiptNumber?: string|number }} options
 * @returns {Promise<'silent'|'dialog'>}
 */
export async function printThermalReceipt({
  useModalShell = false,
  receiptNumber = null,
  sale = null,
} = {}) {
  if (isDesktopCashier()) {
    const num = receiptNumber != null ? String(receiptNumber).trim() : '';

    // Лучший путь: чек из JSON в Electron (журнал продаж, повторная печать)
    if (typeof window.desktopCashier?.printReceiptSale === 'function') {
      const saleForPrint = sale?.receiptNumber ? sale : null;
      if (saleForPrint) {
        try {
          await waitForReceiptDomReady();
          const qrDataUrl = captureReceiptQrDataUrl();
          const payload = buildDesktopSalePrintPayload(saleForPrint, qrDataUrl);
          if (payload) {
            await window.desktopCashier.printReceiptSale(payload);
            return 'silent';
          }
        } catch (err) {
          console.warn('[Aurent] printReceiptSale failed', err);
        }
      }
    }

    // Скрытое окно /receipt/N?silent=1 — полная страница чека со стилями
    if (num && typeof window.desktopCashier?.printReceipt === 'function') {
      try {
        await window.desktopCashier.printReceipt(num);
        return 'silent';
      } catch (err) {
        console.warn('[Aurent] printReceipt hidden window failed', err);
      }
    }

    // HTML-фрагмент без Tailwind — запасной путь
    await waitForReceiptDomReady();
    const html = captureReceiptHtml();
    if (html && typeof window.desktopCashier?.printReceiptHtml === 'function') {
      try {
        await window.desktopCashier.printReceiptHtml(html);
        return 'silent';
      } catch (err) {
        console.warn('[Aurent] printReceiptHtml failed', err);
        cleanupDesktopPrintState();
      }
    }

    // На десктопе window.print() печатает весь экран (Мои продажи / POS), не чек
    if (num || sale?.receiptNumber) {
      throw new Error(
        'Не удалось напечатать чек. Проверьте принтер POS-80 в меню Aurent → Принтер чека.'
      );
    }

    return printThermalReceiptDialog({ useModalShell });
  }

  await waitForReceiptDomReady();
  const classes = useModalShell
    ? [PRINT_THERMAL_CLASS, PRINT_THERMAL_MODAL_CLASS]
    : [PRINT_THERMAL_CLASS];
  const cleanup = prepareThermalPrint(classes);
  return new Promise((resolve) => {
    const done = () => {
      cleanup();
      window.removeEventListener('afterprint', done);
      resolve('dialog');
    };
    window.addEventListener('afterprint', done);
    requestAnimationFrame(() => window.print());
  });
}

/**
 * Печать чека по номеру / со страницы чека.
 * @returns {Promise<'silent'|'dialog'|false>}
 */
export async function printReceipt(receiptNumber, { preferSilent: _preferSilent = true } = {}) {
  if (isDesktopCashier()) {
    return printThermalReceipt({
      useModalShell: isOnReceiptPage() && Boolean(document.getElementById('fiscal-print-shell')),
      receiptNumber,
    });
  }
  printWithHtmlClass(PRINT_THERMAL_CLASS);
  return 'dialog';
}

/** Автопечать после продажи: рендер sale из ответа API → printReceiptHtml (см. PosSaleAutoPrint). */
export async function printReceiptAfterSale(_receiptNumber, saleData = null) {
  if (!isDesktopCashier() || !saleData) return false;
  return Boolean(saleData.receiptNumber);
}

/** Ручная печать со страницы чека. */
export async function printReceiptDialog(receiptNumber) {
  return printReceipt(receiptNumber, { preferSilent: false });
}
