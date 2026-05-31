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

/**
 * Тихая печать через IPC отключена: на Windows/POS-80 стабильнее window.print(),
 * как в веб-версии при кнопке «Печать чека».
 */
export function isDesktopSilentPrintAvailable() {
  return false;
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
 * Тот же способ, что в браузере: @page 80mm + window.print() + диалог Windows.
 * @param {{ useModalShell?: boolean }} options — true для скрытого чека в portal (автопродажа)
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
 * Печать чека (десктоп = диалог Windows; веб = диалог браузера).
 * @returns {Promise<'dialog'|false>}
 */
export async function printReceipt(_receiptNumber, { preferSilent: _preferSilent = true } = {}) {
  if (isDesktopCashier() && isOnReceiptPage()) {
    return printThermalReceiptDialog({ useModalShell: false });
  }
  printWithHtmlClass(PRINT_THERMAL_CLASS);
  return 'dialog';
}

/**
 * Автопечать после продажи: чек в DOM (PosSaleAutoPrint) + window.print().
 * Прямой вызов IPC не используем.
 */
export async function printReceiptAfterSale() {
  return false;
}

/** Ручная печать со страницы чека. */
export async function printReceiptDialog(receiptNumber) {
  return printReceipt(receiptNumber, { preferSilent: false });
}
