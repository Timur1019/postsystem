import {
  prepareThermalPrint,
  PRINT_THERMAL_CLASS,
  PRINT_THERMAL_MODAL_CLASS,
  ELECTRON_SILENT_PRINT_CLASS,
  ELECTRON_PRINT_CAPTURING_CLASS,
} from './printWithHtmlClass';

/** Классы печати — снимаем после job. */
const PRINT_HTML_CLASSES = [
  PRINT_THERMAL_CLASS,
  PRINT_THERMAL_MODAL_CLASS,
  ELECTRON_SILENT_PRINT_CLASS,
  ELECTRON_PRINT_CAPTURING_CLASS,
];

export function isDesktopCashier() {
  return typeof window !== 'undefined' && Boolean(window.desktopCashier?.isDesktop);
}

export function cleanupDesktopPrintState() {
  if (typeof document === 'undefined') return;
  PRINT_HTML_CLASSES.forEach((c) => document.documentElement.classList.remove(c));
  document.getElementById('pos-print-job-page')?.remove();
}

function receiptPrintElement({ preferFiscalShell = false } = {}) {
  if (preferFiscalShell) {
    const shell = document.getElementById('fiscal-print-shell');
    if (shell) {
      const area =
        shell.querySelector('#receipt-print-area') || shell.querySelector('.receipt-print-root');
      if (area) return area;
      return shell;
    }
  }

  const roots = ['#fiscal-print-shell', '#pos-sale-print-shell', '.cashier-sales-receipt-pane__card'];
  for (const rootSel of roots) {
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

function shouldUseModalPrintShell(explicit) {
  if (explicit === true) return true;
  if (explicit === false) return false;
  return Boolean(document.getElementById('fiscal-print-shell'));
}

async function prepareDesktopForPrint() {
  if (!isDesktopCashier()) return;
  if (typeof window.desktopCashier?.prepareForPrint === 'function') {
    try {
      await window.desktopCashier.prepareForPrint();
    } catch {
      /* ignore */
    }
  }
}

async function waitForReceiptDomReady({ useModalShell = false } = {}) {
  const preferFiscalShell = useModalShell || shouldUseModalPrintShell();
  await document.fonts?.ready;
  for (let i = 0; i < 50; i += 1) {
    await new Promise((r) => setTimeout(r, 100));
    const area = receiptPrintElement({ preferFiscalShell });
    if (!area) continue;
    const textLen = (area.innerText || '').trim().length;
    const h = Math.max(area.scrollHeight, area.offsetHeight, area.getBoundingClientRect().height);
    const imgs = Array.from(area.querySelectorAll('img'));
    const imgsReady = imgs.length === 0 || imgs.every((img) => img.complete);
    const isShiftReport =
      area.classList.contains('receipt-print-root') && !document.getElementById('receipt-print-area');
    const minText = isShiftReport ? 12 : 80;
    const minH = isShiftReport ? 40 : 120;
    if (textLen >= minText && h >= minH && imgsReady) {
      return;
    }
  }
}

async function waitForPaintSettled() {
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((r) => setTimeout(r, 350));
}

/**
 * Печать чека: только термоблок (print-thermal-modal скрывает #root и UI кассы).
 * @returns {Promise<'dialog'>}
 */
export async function printThermalReceiptDialog({ useModalShell } = {}) {
  const modal = shouldUseModalPrintShell(useModalShell);
  const classes = modal
    ? [PRINT_THERMAL_CLASS, PRINT_THERMAL_MODAL_CLASS]
    : [PRINT_THERMAL_CLASS];

  await waitForReceiptDomReady({ useModalShell: modal });
  await prepareDesktopForPrint();

  const cleanup = prepareThermalPrint(classes);
  return new Promise((resolve) => {
    const done = () => {
      cleanup();
      cleanupDesktopPrintState();
      window.removeEventListener('afterprint', done);
      resolve('dialog');
    };
    window.addEventListener('afterprint', done);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  });
}

/**
 * Автопечать после продажи.
 * Десктоп: одна тихая попытка на #fiscal-print-shell (portal), иначе диалог как при ручной печати.
 */
export async function printThermalReceiptAuto() {
  await waitForReceiptDomReady({ useModalShell: true });
  await prepareDesktopForPrint();

  const silentClasses = [PRINT_THERMAL_CLASS, PRINT_THERMAL_MODAL_CLASS, ELECTRON_SILENT_PRINT_CLASS];

  try {
    if (isDesktopCashier() && typeof window.desktopCashier?.printReceiptAuto === 'function') {
      const cleanup = prepareThermalPrint(silentClasses);
      try {
        await waitForPaintSettled();
        await new Promise((r) => setTimeout(r, 500));
        await window.desktopCashier.printReceiptAuto();
        return 'silent';
      } finally {
        cleanup();
        cleanupDesktopPrintState();
      }
    }
    return printThermalReceiptDialog({ useModalShell: true });
  } catch (err) {
    console.warn('[Aurent] silent auto print failed, dialog fallback', err);
    cleanupDesktopPrintState();
    return printThermalReceiptDialog({ useModalShell: true });
  }
}

export async function printThermalReceipt({
  useModalShell,
  receiptNumber: _receiptNumber = null,
} = {}) {
  await printThermalReceiptDialog({ useModalShell });
  return 'dialog';
}

export async function printReceipt(receiptNumber, { preferSilent: _preferSilent = true } = {}) {
  return printThermalReceipt({ receiptNumber });
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
    host.className = 'fiscal-print-scene';
    host.innerHTML = `<div class="fiscal-print-dialog"><div id="fiscal-print-shell">
      <div id="receipt-print-area" class="receipt-print-root">
      <p class="receipt-title">AURENT — Тест</p>
      <p>Тестовая печать · 80 mm</p>
      <p>Если этот чек вышел — принтер настроен.</p>
    </div></div></div>`;
    document.body.appendChild(host);
  }
  try {
    await printThermalReceiptDialog({ useModalShell: true });
  } finally {
    host.remove();
  }
}
