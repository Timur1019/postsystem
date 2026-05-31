import {
  prepareThermalPrint,
  printWithHtmlClass,
  PRINT_THERMAL_CLASS,
  PRINT_THERMAL_MODAL_CLASS,
} from './printWithHtmlClass';

/** Классы печати — снимаем после job. */
const PRINT_HTML_CLASSES = [PRINT_THERMAL_CLASS, PRINT_THERMAL_MODAL_CLASS];

export function isDesktopCashier() {
  return typeof window !== 'undefined' && Boolean(window.desktopCashier?.isDesktop);
}

/** @deprecated Всегда true: печать через window.print. */
export function isDesktopSilentPrintAvailable() {
  return isDesktopCashier();
}

export function cleanupDesktopPrintState() {
  if (typeof document === 'undefined') return;
  PRINT_HTML_CLASSES.forEach((c) => document.documentElement.classList.remove(c));
  document.getElementById('pos-print-job-page')?.remove();
}

const RECEIPT_CAPTURE_ROOTS = [
  '#pos-sale-print-shell',
  '#fiscal-print-shell',
  '.cashier-sales-receipt-pane__card',
];

function receiptPrintElement() {
  for (const rootSel of RECEIPT_CAPTURE_ROOTS) {
    const root = document.querySelector(rootSel);
    if (!root) continue;
    const area =
      root.querySelector('#receipt-print-area') || root.querySelector('.receipt-print-root');
    if (area) return area;
  }
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

/**
 * Печать чека — как в браузере: @media print + диалог Windows.
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
      cleanupDesktopPrintState();
      window.removeEventListener('afterprint', done);
      resolve('dialog');
    };
    window.addEventListener('afterprint', done);
    requestAnimationFrame(() => window.print());
  });
}

/**
 * Автопечать / повторная печать чека (десктоп = тот же window.print).
 */
export async function printDesktopReceiptSale(_sale, { autoPrint: _autoPrint = false } = {}) {
  if (!isDesktopCashier()) {
    return { ok: false };
  }
  try {
    await printThermalReceiptDialog({ useModalShell: false });
    return { ok: true, mode: 'dialog' };
  } catch (err) {
    throw err;
  }
}

/** X/Z — через ThermalReportPrintPortal + window.print (см. CashierShiftModal). */
export async function printDesktopShiftReport() {
  return { ok: false };
}

export async function printThermalReceipt({
  useModalShell = false,
  receiptNumber: _receiptNumber = null,
  sale = null,
} = {}) {
  if (sale?.receiptNumber || isOnReceiptPage()) {
    await printThermalReceiptDialog({
      useModalShell: useModalShell || Boolean(document.getElementById('fiscal-print-shell')),
    });
    return 'dialog';
  }
  await printThermalReceiptDialog({ useModalShell });
  return 'dialog';
}

export async function printReceipt(receiptNumber, { preferSilent: _preferSilent = true } = {}) {
  return printThermalReceipt({
    useModalShell: isOnReceiptPage() && Boolean(document.getElementById('fiscal-print-shell')),
    receiptNumber,
  });
}

export async function printReceiptAfterSale(_receiptNumber, saleData = null) {
  return Boolean(saleData?.receiptNumber);
}

export async function printReceiptDialog(receiptNumber) {
  return printReceipt(receiptNumber, { preferSilent: false });
}

/** Тестовая печать из меню Aurent (десктоп). */
export async function printBrowserTestReceipt() {
  const hostId = 'aurent-test-receipt-print-host';
  let host = document.getElementById(hostId);
  if (!host) {
    host = document.createElement('div');
    host.id = hostId;
    host.innerHTML = `<div id="receipt-print-area" class="receipt-print-root">
      <p class="receipt-title">AURENT — Тест</p>
      <p>Тестовая печать · 80 mm</p>
      <p>Если этот чек вышел — принтер настроен.</p>
    </div>`;
    document.body.appendChild(host);
  }
  try {
    await printThermalReceiptDialog({ useModalShell: false });
  } finally {
    host.remove();
  }
}
