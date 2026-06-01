import { ELECTRON_PRINT_CAPTURING_CLASS } from './printWithHtmlClass';
import { isDesktopCashier, withElectronPrintCapture } from './printReceipt';
import { cancelScheduledLabelPrintUnmount } from './labelPrintMount';

export const ELECTRON_SILENT_LABEL_CLASS = 'electron-silent-label';
export const SHELF_LABEL_PRINT_ACTIVE_CLASS = 'shelflabel-printing-active';

const LABEL_PRINT_HTML_CLASSES = [
  ELECTRON_SILENT_LABEL_CLASS,
  SHELF_LABEL_PRINT_ACTIVE_CLASS,
  ELECTRON_PRINT_CAPTURING_CLASS,
];

const SILENT_LABEL_MAX_ATTEMPTS = 3;

export function isDesktopLabelPrintAvailable() {
  return (
    isDesktopCashier() && typeof window.desktopCashier?.printLabelPage === 'function'
  );
}

export function cleanupLabelPrintState() {
  if (typeof document === 'undefined') return;
  LABEL_PRINT_HTML_CLASSES.forEach((c) => document.documentElement.classList.remove(c));
  document.body.classList.remove(SHELF_LABEL_PRINT_ACTIVE_CLASS);
}

function prepareLabelPrint() {
  document.documentElement.classList.add(ELECTRON_SILENT_LABEL_CLASS);
  document.body.classList.add(SHELF_LABEL_PRINT_ACTIVE_CLASS);
}

async function waitForPaintSettled() {
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((r) => setTimeout(r, 300));
}

function barcodeSvgsReady(layer, requireBarcode) {
  if (!requireBarcode) return true;
  const svgs = layer.querySelectorAll('.shelflabel-barcode-svg');
  if (!svgs.length) return false;
  return [...svgs].every((svg) => svg.querySelector('rect, path, line, g'));
}

export async function waitForLabelDomReady({ requireBarcode = true } = {}) {
  await document.fonts?.ready;
  for (let i = 0; i < 60; i += 1) {
    await new Promise((r) => setTimeout(r, 80));
    const layer = document.getElementById('shelf-label-print-layer');
    if (!layer) continue;
    const pages = layer.querySelectorAll('.shelflabel-print-page');
    if (!pages.length) continue;
    if (!barcodeSvgsReady(layer, requireBarcode)) continue;
    const h = Math.max(layer.scrollHeight, layer.offsetHeight, layer.getBoundingClientRect().height);
    if (h >= 30) {
      return;
    }
  }
  throw new Error('Этикетка не готова для печати');
}

function assertLabelLayerReady(requireBarcode) {
  const layer = document.getElementById('shelf-label-print-layer');
  if (!layer) {
    throw new Error('Этикетка не найдена в окне');
  }
  if (!layer.querySelectorAll('.shelflabel-print-page').length) {
    throw new Error('Нет страниц для печати');
  }
  if (requireBarcode && !barcodeSvgsReady(layer, true)) {
    throw new Error('Штрихкод ещё не отрисован');
  }
}

function normalizeLabelPrintError(err) {
  const raw = err?.message || String(err || '');
  if (/Script failed to execute/i.test(raw)) {
    return new Error('Сбой печати этикетки. Повторите или выберите принтер: Aurent → «Принтер штрих-кодов».');
  }
  if (/Error invoking remote method/i.test(raw)) {
    const inner = raw
      .replace(/^Error invoking remote method ['"]?[^'"]+['"]?:\s*/i, '')
      .trim();
    if (inner && !/Script failed to execute/i.test(inner)) {
      return new Error(inner);
    }
  }
  return err instanceof Error ? err : new Error(raw || 'Печать этикетки не выполнена');
}

async function invokeDesktopLabelPrint(requireBarcode = true) {
  let lastErr;
  for (let attempt = 1; attempt <= SILENT_LABEL_MAX_ATTEMPTS; attempt += 1) {
    try {
      assertLabelLayerReady(requireBarcode);
      cancelScheduledLabelPrintUnmount();
      await withElectronPrintCapture(() => window.desktopCashier.printLabelPage(), {
        settleMs: 450,
      });
      return;
    } catch (err) {
      lastErr = normalizeLabelPrintError(err);
      console.warn(`[Aurent] label print attempt ${attempt}/${SILENT_LABEL_MAX_ATTEMPTS}`, lastErr);
      if (attempt < SILENT_LABEL_MAX_ATTEMPTS) {
        await waitForLabelDomReady({ requireBarcode }).catch(() => undefined);
        await waitForPaintSettled();
        await new Promise((r) => setTimeout(r, 350 * attempt));
      }
    }
  }
  throw lastErr || new Error('Печать этикетки не выполнена');
}

/**
 * Тихая печать этикетки (Electron) или диалог браузера.
 */
export async function printShelfLabelSilent({ requireBarcode = true } = {}) {
  if (!isDesktopLabelPrintAvailable()) {
    document.body.classList.add(SHELF_LABEL_PRINT_ACTIVE_CLASS);
    await waitForLabelDomReady({ requireBarcode }).catch(() => undefined);
    await waitForPaintSettled();
    return new Promise((resolve) => {
      const done = () => {
        cleanupLabelPrintState();
        window.removeEventListener('afterprint', done);
        resolve('dialog');
      };
      window.addEventListener('afterprint', done);
      window.print();
    });
  }

  prepareLabelPrint();
  try {
    await waitForLabelDomReady({ requireBarcode });
    await waitForPaintSettled();
    await new Promise((r) => setTimeout(r, 200));
    await invokeDesktopLabelPrint(requireBarcode);
    return 'silent';
  } finally {
    cleanupLabelPrintState();
  }
}
