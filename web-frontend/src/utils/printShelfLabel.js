import { ELECTRON_PRINT_CAPTURING_CLASS } from './printWithHtmlClass';
import { isDesktopCashier } from './printReceipt';
import { cancelScheduledLabelPrintUnmount } from './labelPrintMount';

export const ELECTRON_SILENT_LABEL_CLASS = 'electron-silent-label';
export const SHELF_LABEL_PRINT_ACTIVE_CLASS = 'shelflabel-printing-active';
const LAYOUT_MEASURE_CLASS = 'shelflabel-layout-measure';

const LABEL_PRINT_HTML_CLASSES = [
  ELECTRON_SILENT_LABEL_CLASS,
  SHELF_LABEL_PRINT_ACTIVE_CLASS,
  ELECTRON_PRINT_CAPTURING_CLASS,
];

const SILENT_LABEL_MAX_ATTEMPTS = 3;
const LABEL_JOB_PAGE_STYLE_ID = 'pos-label-job-page';

export function isDesktopLabelPrintAvailable() {
  return (
    isDesktopCashier() && typeof window.desktopCashier?.printLabelPage === 'function'
  );
}

export function cleanupLabelPrintState() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove(LAYOUT_MEASURE_CLASS);
  LABEL_PRINT_HTML_CLASSES.forEach((c) => document.documentElement.classList.remove(c));
  document.body.classList.remove(SHELF_LABEL_PRINT_ACTIVE_CLASS);
  document.getElementById(LABEL_JOB_PAGE_STYLE_ID)?.remove();
}

function injectLabelPageRuleFromCssVars() {
  const root = document.documentElement;
  const w = Number(root.style.getPropertyValue('--label-paper-w-mm')) || 58;
  const h = Number(root.style.getPropertyValue('--label-paper-h-mm')) || 40;
  const m = Number(root.style.getPropertyValue('--label-page-margin-mm')) || 0;
  let el = document.getElementById(LABEL_JOB_PAGE_STYLE_ID);
  if (!el) {
    el = document.createElement('style');
    el.id = LABEL_JOB_PAGE_STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = `@page { size: ${w}mm ${h}mm; margin: ${m}mm; }`;
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
  return [...svgs].every((svg) => {
    const shapes = svg.querySelectorAll('rect, path, line, g, text');
    return shapes.length > 0;
  });
}

function pageHasLayout(pages) {
  if (!pages.length) return false;
  const page = pages[0];
  const h = Math.max(
    page.offsetHeight || 0,
    page.scrollHeight || 0,
    page.getBoundingClientRect().height || 0,
  );
  if (h >= 8) return true;
  const root = document.documentElement;
  const paperHmm = parseFloat(root.style.getPropertyValue('--label-paper-h-mm')) || 0;
  return paperHmm >= 15;
}

/**
 * @param {HTMLElement} layer
 * @param {boolean} requireBarcode
 */
export function isLabelPrintLayerReady(layer, requireBarcode = true) {
  if (!layer) return false;
  const pages = layer.querySelectorAll('.shelflabel-print-page');
  if (!pages.length) return false;
  if (!barcodeSvgsReady(layer, requireBarcode)) return false;
  return pageHasLayout(pages);
}

export async function waitForLabelDomReady({ requireBarcode = true } = {}) {
  await document.fonts?.ready;
  document.documentElement.classList.add(LAYOUT_MEASURE_CLASS);
  try {
    for (let i = 0; i < 90; i += 1) {
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => setTimeout(r, i < 5 ? 120 : 80));
      const layer = document.getElementById('shelf-label-print-layer');
      if (isLabelPrintLayerReady(layer, requireBarcode)) {
        return;
      }
    }
  } finally {
    document.documentElement.classList.remove(LAYOUT_MEASURE_CLASS);
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
  document.documentElement.classList.add(LAYOUT_MEASURE_CLASS);
  try {
    if (!isLabelPrintLayerReady(layer, requireBarcode)) {
      if (requireBarcode && !barcodeSvgsReady(layer, true)) {
        throw new Error('Штрихкод ещё не отрисован');
      }
      throw new Error('Этикетка не готова для печати');
    }
  } finally {
    document.documentElement.classList.remove(LAYOUT_MEASURE_CLASS);
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

async function withLabelPrintCapture(runPrint, { settleMs = 450 } = {}) {
  try {
    await waitForPaintSettled();
    document.documentElement.classList.add(ELECTRON_PRINT_CAPTURING_CLASS);
    await new Promise((r) => setTimeout(r, settleMs));
    return await runPrint();
  } finally {
    document.documentElement.classList.remove(ELECTRON_PRINT_CAPTURING_CLASS);
  }
}

async function invokeDesktopLabelPrint(requireBarcode = true) {
  let lastErr;
  for (let attempt = 1; attempt <= SILENT_LABEL_MAX_ATTEMPTS; attempt += 1) {
    try {
      assertLabelLayerReady(requireBarcode);
      cancelScheduledLabelPrintUnmount();
      await withLabelPrintCapture(() => window.desktopCashier.printLabelPage(), {
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
    return new Promise((resolve, reject) => {
      injectLabelPageRuleFromCssVars();
      const done = () => {
        cleanupLabelPrintState();
        window.removeEventListener('afterprint', done);
        resolve('dialog');
      };
      window.addEventListener('afterprint', done);
      const fallback = setTimeout(() => {
        cleanupLabelPrintState();
        window.removeEventListener('afterprint', done);
        resolve('dialog');
      }, 2200);
      const doneWrapped = () => {
        clearTimeout(fallback);
        done();
      };
      window.removeEventListener('afterprint', done);
      window.addEventListener('afterprint', doneWrapped);
      void waitForLabelDomReady({ requireBarcode }).catch(() => undefined);
      try {
        requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
      } catch (e) {
        clearTimeout(fallback);
        cleanupLabelPrintState();
        window.removeEventListener('afterprint', doneWrapped);
        reject(e);
      }
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
