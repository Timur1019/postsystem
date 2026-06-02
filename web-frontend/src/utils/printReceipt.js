/**
 * Печать фискального чека: диалог браузера и тихая печать Electron.
 *
 * Поток автопечати после продажи:
 *   PosSaleAutoPrint → printThermalReceiptAuto → invokeDesktopSilentPrint
 *
 * Тайминги / пороги / id DOM → config/receiptPrintConfig.js
 * Ожидание готовности DOM → utils/receiptPrintWait.js
 * Mount превью / body для print → utils/autoPrintMount.js
 */
import { RECEIPT_PRINT_DOM, RECEIPT_PRINT_ENGINE } from '../config/receiptPrintConfig';
import { prepareBodyPrintShellFromPreview, prepareMountForSilentCapture } from './autoPrintMount';
import {
  assertFiscalPrintShellReady,
  sleep,
  waitForBodyPrintImagesReady,
  waitForDoubleAnimationFrame,
  waitForReceiptDomReady,
  waitForReceiptPaintSettled,
} from './receiptPrintWait';
import {
  prepareThermalPrint,
  PRINT_THERMAL_CLASS,
  PRINT_THERMAL_MODAL_CLASS,
  ELECTRON_SILENT_PRINT_CLASS,
  ELECTRON_AUTO_PRINT_JOB_CLASS,
  ELECTRON_PRINT_CAPTURING_CLASS,
} from './printWithHtmlClass';

const PRINT_HTML_CLASSES = [
  PRINT_THERMAL_CLASS,
  PRINT_THERMAL_MODAL_CLASS,
  ELECTRON_SILENT_PRINT_CLASS,
  ELECTRON_AUTO_PRINT_JOB_CLASS,
  ELECTRON_PRINT_CAPTURING_CLASS,
];

const SILENT_AUTO_PRINT_CLASSES = [
  PRINT_THERMAL_CLASS,
  PRINT_THERMAL_MODAL_CLASS,
  ELECTRON_SILENT_PRINT_CLASS,
  ELECTRON_AUTO_PRINT_JOB_CLASS,
];

export function isDesktopCashier() {
  return typeof window !== 'undefined' && Boolean(window.desktopCashier?.isDesktop);
}

export function cleanupDesktopPrintState() {
  if (typeof document === 'undefined') return;
  PRINT_HTML_CLASSES.forEach((c) => document.documentElement.classList.remove(c));
  document.getElementById(RECEIPT_PRINT_DOM.printJobPageStyleId)?.remove();
  document.getElementById(RECEIPT_PRINT_DOM.autoPrintMountId)?.remove();
}

function shouldUseModalPrintShell(explicit) {
  if (explicit === true) return true;
  if (explicit === false) return false;
  return Boolean(document.getElementById(RECEIPT_PRINT_DOM.fiscalPrintShellId));
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

/** Кадр для silent print — класс electron-print-capturing на <html>. */
export async function withElectronPrintCapture(
  runPrint,
  { settleMs = RECEIPT_PRINT_ENGINE.captureSettleMs, afterPrint } = {},
) {
  document.documentElement.classList.add(ELECTRON_PRINT_CAPTURING_CLASS);
  const undoCaptureLayout = prepareMountForSilentCapture();
  try {
    await waitForReceiptPaintSettled();
    await sleep(settleMs);
    const result = await runPrint();
    afterPrint?.();
    return result;
  } finally {
    undoCaptureLayout();
    await sleep(RECEIPT_PRINT_ENGINE.captureReleaseDelayMs);
    document.documentElement.classList.remove(ELECTRON_PRINT_CAPTURING_CLASS);
  }
}

function normalizeDesktopPrintError(err) {
  const raw = err?.message || String(err || '');
  if (/Script failed to execute/i.test(raw)) {
    return new Error('Сбой печати в окне кассы. Повторите продажу или тест из меню Aurent.');
  }
  if (/Error invoking remote method/i.test(raw)) {
    const inner = raw
      .replace(/^Error invoking remote method ['"]?[^'"]+['"]?:\s*/i, '')
      .trim();
    if (inner && !/Script failed to execute/i.test(inner)) {
      return new Error(inner);
    }
  }
  return err instanceof Error ? err : new Error(raw || 'Тихая печать не выполнена');
}

async function invokeDesktopSilentPrint() {
  const { silentMaxAttempts, silentRetryBackoffBaseMs } = RECEIPT_PRINT_ENGINE;
  let lastErr;

  for (let attempt = 1; attempt <= silentMaxAttempts; attempt += 1) {
    let undoBodyPrint = () => {};
    try {
      undoBodyPrint = await prepareBodyPrintShellFromPreview();
      await waitForReceiptPaintSettled();
      await waitForBodyPrintImagesReady();
      assertFiscalPrintShellReady();
      console.info(`[Aurent] silent print IPC attempt ${attempt}/${silentMaxAttempts}`);
      await withElectronPrintCapture(() => window.desktopCashier.printReceiptAuto(), {
        afterPrint: undoBodyPrint,
      });
      return;
    } catch (err) {
      lastErr = normalizeDesktopPrintError(err);
      console.warn(`[Aurent] silent print attempt ${attempt}/${silentMaxAttempts}`, lastErr.message);
      undoBodyPrint();
      if (attempt < silentMaxAttempts) {
        await waitForReceiptDomReady({ useModalShell: true }).catch(() => undefined);
        await waitForReceiptPaintSettled();
        await sleep(silentRetryBackoffBaseMs * attempt);
      }
    }
  }
  throw lastErr || new Error('Тихая печать не выполнена');
}

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
    waitForDoubleAnimationFrame().then(() => window.print());
  });
}

export async function printThermalReceiptAuto() {
  if (!isDesktopCashier() || typeof window.desktopCashier?.printReceiptAuto !== 'function') {
    return printThermalReceiptDialog({ useModalShell: true });
  }

  await prepareDesktopForPrint();
  const cleanup = prepareThermalPrint(SILENT_AUTO_PRINT_CLASSES);
  try {
    await waitForReceiptDomReady({ useModalShell: true });
    await waitForReceiptPaintSettled();
    await sleep(RECEIPT_PRINT_ENGINE.preSilentInvokeDelayMs);
    await invokeDesktopSilentPrint();
    return 'silent';
  } finally {
    cleanup();
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

export async function printBrowserTestReceipt() {
  const hostId = RECEIPT_PRINT_DOM.testPrintHostId;
  let host = document.getElementById(hostId);
  if (!host) {
    host = document.createElement('div');
    host.id = hostId;
    host.className = 'fiscal-print-scene';
    host.innerHTML = `<div class="fiscal-print-dialog"><div id="${RECEIPT_PRINT_DOM.fiscalPrintShellId}">
      <div id="${RECEIPT_PRINT_DOM.receiptPrintAreaId}" class="receipt-print-root">
      <p class="receipt-title">AURENT — Тест</p>
      <p>Тестовая печать · 80 mm</p>
      <p>Если этот чек вышел — принтер настроен.</p>
    </div></div></div>`;
    document.body.appendChild(host);
  }
  try {
    if (isDesktopCashier() && typeof window.desktopCashier?.printReceiptAuto === 'function') {
      const cleanup = prepareThermalPrint(SILENT_AUTO_PRINT_CLASSES);
      try {
        await waitForReceiptDomReady({ useModalShell: true });
        await waitForReceiptPaintSettled();
        await invokeDesktopSilentPrint();
        return 'silent';
      } finally {
        cleanup();
        cleanupDesktopPrintState();
      }
    }
    await printThermalReceiptDialog({ useModalShell: true });
  } finally {
    host.remove();
  }
}
