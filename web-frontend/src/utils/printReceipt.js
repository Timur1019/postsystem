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

/** Тихая печать через скрытое окно Electron (не printCurrentPage с главного экрана). */
export function isDesktopSilentPrintAvailable() {
  return (
    isDesktopCashier() &&
    (typeof window.desktopCashier?.printReceipt === 'function' ||
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

function captureReceiptHtml() {
  const area = document.getElementById('receipt-print-area');
  if (!area) return '';
  const textLen = (area.innerText || '').trim().length;
  if (textLen < 40) return '';
  return area.outerHTML;
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
export async function printThermalReceipt({ useModalShell = false, receiptNumber = null } = {}) {
  if (isDesktopCashier()) {
    const num = receiptNumber != null ? String(receiptNumber).trim() : '';

    // Сначала HTML из уже отрисованного чека (продажа / portal)
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

    // Повторная печать по номеру (чек уже в базе)
    if (num && typeof window.desktopCashier?.printReceipt === 'function') {
      try {
        await window.desktopCashier.printReceipt(num);
        return 'silent';
      } catch (err) {
        console.warn('[Aurent] printReceipt hidden window failed', err);
      }
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
