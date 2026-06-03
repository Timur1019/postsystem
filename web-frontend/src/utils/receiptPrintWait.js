/**
 * Ожидание готовности чека к печати (диалог / модалка / страница).
 */
import {
  RECEIPT_PRINT_DOM,
  RECEIPT_PRINT_ENGINE,
  RECEIPT_PRINT_THRESHOLDS,
} from '../config/receiptPrintConfig';

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function waitForDoubleAnimationFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

export function findReceiptPrintArea({ preferFiscalShell = false } = {}) {
  const { fiscalPrintShellId, receiptPrintAreaId, printRootSelectors } = RECEIPT_PRINT_DOM;

  if (preferFiscalShell) {
    const shell = document.getElementById(fiscalPrintShellId);
    if (shell) {
      return (
        shell.querySelector(`#${receiptPrintAreaId}`) ||
        shell.querySelector('.receipt-print-root') ||
        shell
      );
    }
  }

  for (const rootSel of printRootSelectors) {
    const root = document.querySelector(rootSel);
    if (!root) continue;
    const area =
      root.querySelector(`#${receiptPrintAreaId}`) ||
      root.querySelector('.receipt-print-root') ||
      (root.id === fiscalPrintShellId ? root : null);
    if (area) return area;
  }

  return document.getElementById(receiptPrintAreaId);
}

function receiptReadyThresholds(area) {
  const isShiftReport =
    area?.classList.contains('receipt-print-root') &&
    !area.closest(`#${RECEIPT_PRINT_DOM.receiptPrintAreaId}`) &&
    !document.getElementById(RECEIPT_PRINT_DOM.receiptPrintAreaId);

  if (isShiftReport) {
    return {
      minText: RECEIPT_PRINT_THRESHOLDS.shiftReportMinTextLength,
      minH: RECEIPT_PRINT_THRESHOLDS.shiftReportMinHeightPx,
    };
  }
  return {
    minText: RECEIPT_PRINT_THRESHOLDS.fiscalMinTextLength,
    minH: RECEIPT_PRINT_THRESHOLDS.fiscalMinHeightPx,
  };
}

export function isReceiptPrintAreaReady(area, { requireImages = false } = {}) {
  if (!area) return false;
  const textLen = (area.innerText || '').trim().length;
  const h = Math.max(area.scrollHeight, area.offsetHeight, area.getBoundingClientRect().height);
  const imgs = Array.from(area.querySelectorAll('img'));
  const imgsReady = imgs.length === 0 || imgs.every((img) => img.complete && img.naturalWidth > 0);
  const { minText, minH } = receiptReadyThresholds(area);
  if (requireImages && imgs.length > 0 && !imgsReady) {
    return false;
  }
  return textLen >= minText && h >= minH && imgsReady;
}

export async function waitForReceiptDomReady({ useModalShell = false } = {}) {
  const preferFiscalShell =
    useModalShell || Boolean(document.getElementById(RECEIPT_PRINT_DOM.fiscalPrintShellId));

  await document.fonts?.ready;

  const { domReadyPollIntervalMs, domReadyMaxAttempts } = RECEIPT_PRINT_ENGINE;
  for (let i = 0; i < domReadyMaxAttempts; i += 1) {
    await sleep(domReadyPollIntervalMs);
    const area = findReceiptPrintArea({ preferFiscalShell });
    if (isReceiptPrintAreaReady(area)) {
      return;
    }
  }
  throw new Error('Чек не готов для печати');
}

export async function waitForReceiptPaintSettled() {
  await waitForDoubleAnimationFrame();
  await sleep(RECEIPT_PRINT_ENGINE.paintSettleMs);
}

export function assertFiscalPrintShellReady() {
  const { fiscalPrintShellId, receiptPrintAreaId } = RECEIPT_PRINT_DOM;
  const shell = document.getElementById(fiscalPrintShellId);
  if (!shell) {
    throw new Error('Чек не найден для печати');
  }
  const area =
    shell.querySelector(`#${receiptPrintAreaId}`) ||
    shell.querySelector('.receipt-print-root') ||
    shell;
  const textLen = (area.innerText || area.textContent || '').trim().length;
  const h = Math.max(
    area.scrollHeight,
    shell.scrollHeight,
    area.offsetHeight,
    area.getBoundingClientRect().height,
  );
  const imgs = Array.from(area.querySelectorAll('img'));
  const imgsReady = imgs.length === 0 || imgs.every((img) => img.complete);
  if (!imgsReady) {
    throw new Error('Чек не готов для печати');
  }
  if (textLen < RECEIPT_PRINT_THRESHOLDS.fiscalMinTextLength) {
    throw new Error('Чек не готов для печати');
  }
  if (
    h < RECEIPT_PRINT_THRESHOLDS.fiscalMinHeightPx &&
    textLen < RECEIPT_PRINT_THRESHOLDS.fiscalMinTextLength
  ) {
    throw new Error('Чек не готов для печати');
  }
}
