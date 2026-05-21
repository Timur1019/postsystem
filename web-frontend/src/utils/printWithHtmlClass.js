import { syncPrintCssVars } from './syncPrintCssVars';
import { usePrintSettingsStore } from '../store/printSettingsStore';

function isDesktopSilentPrintAvailable() {
  return typeof window !== 'undefined' && typeof window.desktopCashier?.printReceipt === 'function';
}

export const POS_RECEIPT_PRINT_EVENT = 'pos-request-receipt-print';

/** Класс на `<html>` для печати фискального чека. */
export const PRINT_THERMAL_CLASS = 'print-thermal-only';

/** Доп. класс: печать из модалки журнала (скрывает #root). */
export const PRINT_THERMAL_MODAL_CLASS = 'print-thermal-modal';

/** Electron: стили чека на экране (silent print не всегда применяет @media print). */
export const ELECTRON_SILENT_PRINT_CLASS = 'electron-silent-print';

const THERMAL_PRINT_CLASSES = new Set([
  PRINT_THERMAL_CLASS,
  PRINT_THERMAL_MODAL_CLASS,
  ELECTRON_SILENT_PRINT_CLASS,
  'print-z-report-only',
  'print-shift-report-only',
]);
const JOB_PAGE_STYLE_ID = 'pos-print-job-page';

/**
 * Глобальный @page на время одного вызова печати — иначе диалог часто остаётся на A4:
 * именованная страница (page: thermal) многими движками не связывается с размером листа.
 */
function injectThermalPageRule(state) {
  const paper = Number(state.paperWidthMm) || 80;
  const margin = Number(state.pageMarginMm) ?? 0;
  let el = document.getElementById(JOB_PAGE_STYLE_ID);
  if (!el) {
    el = document.createElement('style');
    el.id = JOB_PAGE_STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = `@page { size: ${paper}mm auto; margin: ${margin}mm; }`;
}

function removeThermalPageRule() {
  document.getElementById(JOB_PAGE_STYLE_ID)?.remove();
}

/**
 * Подготовка DOM/CSS для термопечати без вызова диалога.
 * @returns {() => void} cleanup
 */
export function prepareThermalPrint(className) {
  const classes = (Array.isArray(className) ? className : [className]).filter(Boolean);
  if (isDesktopSilentPrintAvailable()) {
    classes.push(ELECTRON_SILENT_PRINT_CLASS);
  }
  const state = usePrintSettingsStore.getState();
  syncPrintCssVars(state);
  const useThermalPage = classes.some((c) => THERMAL_PRINT_CLASSES.has(c));
  if (useThermalPage) {
    injectThermalPageRule(state);
  }
  classes.forEach((c) => document.documentElement.classList.add(c));

  return () => {
    classes.forEach((c) => document.documentElement.classList.remove(c));
    if (useThermalPage) {
      removeThermalPageRule();
    }
  };
}

/**
 * Adds class(es) on <html> for the duration of one print job (for @media print rules).
 * @param {string | string[]} className — один класс или массив (напр. чек + модалка)
 */
export function printWithHtmlClass(className) {
  const cleanup = prepareThermalPrint(className);
  const done = () => {
    cleanup();
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  requestAnimationFrame(() => window.print());
}
