/**
 * Ожидание готовности чека к печати.
 * Тайминги и пороги — config/receiptPrintConfig.js
 */
import {
  RECEIPT_AUTO_PRINT_UI,
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

function shellSelector() {
  return `#${RECEIPT_PRINT_DOM.fiscalPrintShellId}`;
}

function qrSelector() {
  return `${shellSelector()} ${RECEIPT_PRINT_DOM.qrImageSelector}`;
}

/** PosSaleAutoPrint: ждём QR на превью (не блокирует печать, если QR так и не появился). */
export async function waitForReceiptQrReady(
  maxMs = RECEIPT_AUTO_PRINT_UI.qrWaitMaxMs,
) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const img = document.querySelector(qrSelector());
    if (img && img.complete && img.naturalWidth > 0 && img.src) {
      return img.src;
    }
    if (!document.getElementById(RECEIPT_PRINT_DOM.fiscalPrintShellId)) {
      await sleep(RECEIPT_AUTO_PRINT_UI.qrShellMissingPollMs);
      continue;
    }
    await sleep(RECEIPT_AUTO_PRINT_UI.qrPollIntervalMs);
  }
  return null;
}

export function findReceiptPrintArea({ preferFiscalShell = false } = {}) {
  const { fiscalPrintShellId, receiptPrintAreaId, printRootSelectors } = RECEIPT_PRINT_DOM;

  if (preferFiscalShell) {
    const shell = document.getElementById(fiscalPrintShellId);
    if (shell) {
      return (
        shell.querySelector(`#${receiptPrintAreaId}`) || shell.querySelector('.receipt-print-root') || shell
      );
    }
  }

  for (const rootSel of printRootSelectors) {
    const root = document.querySelector(rootSel);
    if (!root) continue;
    const area =
      root.querySelector(`#${receiptPrintAreaId}`) || root.querySelector('.receipt-print-root');
    if (area) return area;
  }

  return (
    document.getElementById(receiptPrintAreaId) ||
    document.getElementById(fiscalPrintShellId)
  );
}

function receiptReadyThresholds(area) {
  const isShiftReport =
    area?.classList.contains('receipt-print-root') &&
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

export function isReceiptPrintAreaReady(area) {
  if (!area) return false;
  const textLen = (area.innerText || '').trim().length;
  const h = Math.max(area.scrollHeight, area.offsetHeight, area.getBoundingClientRect().height);
  const imgs = Array.from(area.querySelectorAll('img'));
  const imgsReady = imgs.length === 0 || imgs.every((img) => img.complete);
  const { minText, minH } = receiptReadyThresholds(area);
  return textLen >= minText && h >= minH && imgsReady;
}

/** printReceipt: текст, высота, img.complete */
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
  const shell = document.getElementById(RECEIPT_PRINT_DOM.fiscalPrintShellId);
  if (!shell) {
    throw new Error('Чек не найден в окне');
  }
  const area =
    shell.querySelector(`#${RECEIPT_PRINT_DOM.receiptPrintAreaId}`) ||
    shell.querySelector('.receipt-print-root') ||
    shell;
  const textLen = (area.innerText || '').trim().length;
  if (textLen < RECEIPT_PRINT_THRESHOLDS.fiscalMinTextLength) {
    throw new Error('Чек не готов для печати');
  }
}
