import {
  prepareThermalPrint,
  printWithHtmlClass,
  PRINT_THERMAL_CLASS,
  PRINT_THERMAL_MODAL_CLASS,
} from './printWithHtmlClass';

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
  for (let i = 0; i < 45; i += 1) {
    await new Promise((r) => setTimeout(r, 100));
    const area = receiptPrintElement();
    if (!area) continue;
    const textLen = (area.innerText || '').trim().length;
    const h = Math.max(area.scrollHeight, area.offsetHeight, area.getBoundingClientRect().height);
    const imgsReady = Array.from(document.images).every((img) => img.complete);
    if (textLen >= 40 && h >= 80 && imgsReady) {
      return;
    }
  }
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
      return 'silent';
    } catch (err) {
      console.warn('[Aurent] silent print failed, opening dialog', err);
      return printThermalReceiptDialog({ useModalShell });
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
