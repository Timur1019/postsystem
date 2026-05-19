import { syncPrintCssVars } from './syncPrintCssVars';
import { usePrintSettingsStore } from '../store/printSettingsStore';

export const POS_RECEIPT_PRINT_EVENT = 'pos-request-receipt-print';

const THERMAL_PRINT_CLASSES = new Set(['print-receipt-only', 'print-fiscal-only', 'print-z-report-only']);
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
 * Adds a class on <html> for the duration of one print job (for @media print rules).
 */
export function printWithHtmlClass(className) {
  const state = usePrintSettingsStore.getState();
  syncPrintCssVars(state);
  const useThermalPage = THERMAL_PRINT_CLASSES.has(className);
  if (useThermalPage) {
    injectThermalPageRule(state);
  }

  const done = () => {
    document.documentElement.classList.remove(className);
    window.removeEventListener('afterprint', done);
    if (useThermalPage) {
      removeThermalPageRule();
    }
  };
  window.addEventListener('afterprint', done);
  document.documentElement.classList.add(className);
  requestAnimationFrame(() => window.print());
}
