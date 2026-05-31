import {
  prepareThermalPrint,
  printWithHtmlClass,
  PRINT_THERMAL_CLASS,
  PRINT_THERMAL_MODAL_CLASS,
  ELECTRON_SILENT_PRINT_CLASS,
} from './printWithHtmlClass';

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

/** Тихая печать текущего чека в DOM (без диалога Windows). */
export function isDesktopSilentPrintAvailable() {
  return (
    isDesktopCashier() && typeof window.desktopCashier?.printCurrentPage === 'function'
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

function delayAfterSilentPrintMs() {
  return typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent) ? 700 : 200;
}

/**
 * Диалог печати (запасной путь, если тихая печать не сработала).
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
 * Печать чека: сначала тихо (Electron → POS-80), при ошибке — диалог Windows.
 * @returns {Promise<'silent'|'dialog'>}
 */
export async function printThermalReceipt({ useModalShell = false } = {}) {
  await waitForReceiptDomReady();
  if (isDesktopSilentPrintAvailable()) {
    try {
      await window.desktopCashier.printCurrentPage();
      await new Promise((r) => setTimeout(r, delayAfterSilentPrintMs()));
      return 'silent';
    } catch (err) {
      console.warn('[Aurent] silent print failed, opening dialog', err);
      cleanupDesktopPrintState();
      return printThermalReceiptDialog({ useModalShell });
    } finally {
      cleanupDesktopPrintState();
    }
  }
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
export async function printReceipt(_receiptNumber, { preferSilent: _preferSilent = true } = {}) {
  if (isDesktopCashier() && isOnReceiptPage()) {
    return printThermalReceipt({ useModalShell: false });
  }
  printWithHtmlClass(PRINT_THERMAL_CLASS);
  return 'dialog';
}

/** Автопечать после продажи — через PosSaleAutoPrint + printThermalReceipt. */
export async function printReceiptAfterSale() {
  return false;
}

/** Ручная печать со страницы чека. */
export async function printReceiptDialog(receiptNumber) {
  return printReceipt(receiptNumber, { preferSilent: false });
}
