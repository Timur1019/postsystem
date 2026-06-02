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
import { findLivePreviewShell, getAutoPrintFiscalShell } from './autoPrintMount';

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function waitForDoubleAnimationFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function qrSelectors() {
  const { previewShellId, fiscalPrintShellId, qrImageSelector } = RECEIPT_PRINT_DOM;
  return [
    `#${previewShellId} ${qrImageSelector}`,
    `#${fiscalPrintShellId} ${qrImageSelector}`,
  ];
}

/** PosSaleAutoPrint: ждём QR на превью. */
export async function waitForReceiptQrReady(
  maxMs = RECEIPT_AUTO_PRINT_UI.qrWaitMaxMs,
) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    for (const sel of qrSelectors()) {
      const img = document.querySelector(sel);
      if (img && img.complete && img.naturalWidth > 0 && img.src) {
        return img.src;
      }
    }
    if (!findLivePreviewShell()) {
      await sleep(RECEIPT_AUTO_PRINT_UI.qrShellMissingPollMs);
      continue;
    }
    await sleep(RECEIPT_AUTO_PRINT_UI.qrPollIntervalMs);
  }
  return null;
}

export function findReceiptPrintArea({ preferFiscalShell = false, previewOnly = false } = {}) {
  const { fiscalPrintShellId, previewShellId, receiptPrintAreaId, printRootSelectors } =
    RECEIPT_PRINT_DOM;

  if (previewOnly || preferFiscalShell) {
    const shell = previewOnly
      ? findLivePreviewShell()
      : findLivePreviewShell() || document.getElementById(fiscalPrintShellId);
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
      (root.id === previewShellId || root.id === fiscalPrintShellId ? root : null);
    if (area) return area;
  }

  return (
    document.getElementById(receiptPrintAreaId) ||
    findLivePreviewShell() ||
    document.getElementById(fiscalPrintShellId)
  );
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

export function isReceiptPrintAreaReady(area) {
  if (!area) return false;
  const textLen = (area.innerText || '').trim().length;
  const h = Math.max(area.scrollHeight, area.offsetHeight, area.getBoundingClientRect().height);
  const imgs = Array.from(area.querySelectorAll('img'));
  const imgsReady = imgs.length === 0 || imgs.every((img) => img.complete);
  const { minText, minH } = receiptReadyThresholds(area);
  return textLen >= minText && h >= minH && imgsReady;
}

/** Ждём готовности превью в слоте (до копии на body). */
export async function waitForReceiptDomReady({ useModalShell = false } = {}) {
  const preferPreview =
    useModalShell ||
    Boolean(findLivePreviewShell()) ||
    Boolean(document.getElementById(RECEIPT_PRINT_DOM.fiscalPrintShellId));

  await document.fonts?.ready;

  const { domReadyPollIntervalMs, domReadyMaxAttempts } = RECEIPT_PRINT_ENGINE;
  for (let i = 0; i < domReadyMaxAttempts; i += 1) {
    await sleep(domReadyPollIntervalMs);
    const area = findReceiptPrintArea({ preferFiscalShell: preferPreview, previewOnly: true });
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

export async function waitForBodyPrintImagesReady(
  maxMs = RECEIPT_PRINT_ENGINE.bodyImageWaitMaxMs,
) {
  const shell = getAutoPrintFiscalShell();
  if (!shell) return;
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const imgs = Array.from(shell.querySelectorAll('img'));
    if (imgs.length === 0 || imgs.every((img) => img.complete)) {
      return;
    }
    await sleep(RECEIPT_PRINT_ENGINE.domReadyPollIntervalMs);
  }
}

export function assertFiscalPrintShellReady() {
  const shell = getAutoPrintFiscalShell();
  const root = document.getElementById('root');
  if (!shell || root?.contains(shell)) {
    console.warn('[Aurent] fiscal shell missing or inside #root');
    throw new Error('Чек не найден для печати');
  }
  const area =
    shell.querySelector(`#${RECEIPT_PRINT_DOM.receiptPrintAreaId}`) ||
    shell.querySelector('.receipt-print-root') ||
    shell;
  const textLen = (area.innerText || '').trim().length;
  const h = Math.max(area.scrollHeight, area.offsetHeight, area.getBoundingClientRect().height);
  const imgs = Array.from(area.querySelectorAll('img'));
  const imgsReady = imgs.length === 0 || imgs.every((img) => img.complete);
  if (!imgsReady) {
    console.warn('[Aurent] body print shell: images not ready');
    throw new Error('Чек не готов для печати');
  }
  if (textLen < RECEIPT_PRINT_THRESHOLDS.fiscalMinTextLength) {
    console.warn('[Aurent] body print shell: text too short', textLen);
    throw new Error('Чек не готов для печати');
  }
  if (h < RECEIPT_PRINT_THRESHOLDS.fiscalMinHeightPx) {
    console.warn('[Aurent] body print shell: height too small', h);
    throw new Error('Чек не готов для печати');
  }
}
