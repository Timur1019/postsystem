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
import { findPreviewShell, getAutoPrintFiscalShell } from './autoPrintMount';

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function waitForDoubleAnimationFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function findPrintShellPrintArea() {
  const shell = getAutoPrintFiscalShell();
  const root = document.getElementById('root');
  if (!shell || root?.contains(shell)) return null;
  return (
    shell.querySelector(`#${RECEIPT_PRINT_DOM.receiptPrintAreaId}`) ||
    shell.querySelector('.receipt-print-root') ||
    shell
  );
}

function findPreviewShellPrintArea() {
  const { previewMountId, previewShellId, receiptPrintAreaId } = RECEIPT_PRINT_DOM;
  const shell = document.querySelector(`#${previewMountId} #${previewShellId}`);
  if (!shell) return null;
  return (
    shell.querySelector(`#${receiptPrintAreaId}-live`) ||
    shell.querySelector(`#${receiptPrintAreaId}`) ||
    shell.querySelector('.receipt-print-root') ||
    shell
  );
}

/** Очередь автопечати: готовность print-host (QR отдельно). */
export async function waitForPrintShellDomReady() {
  await document.fonts?.ready;
  const { domReadyPollIntervalMs, domReadyMaxAttempts } = RECEIPT_PRINT_ENGINE;
  for (let i = 0; i < domReadyMaxAttempts; i += 1) {
    await sleep(domReadyPollIntervalMs);
    const area = findPrintShellPrintArea();
    if (isReceiptPrintAreaReady(area)) {
      return;
    }
  }
  throw new Error('Чек не готов для печати');
}

/**
 * После sync превью → print-host: не проверяем scrollHeight off-screen (часто 0).
 * Достаточно текста + картинок; высоту берём с видимого превью.
 */
export function assertPrintShellReadyForIpc() {
  const shell = getAutoPrintFiscalShell();
  const root = document.getElementById('root');
  if (!shell || root?.contains(shell)) {
    throw new Error('Чек не найден для печати');
  }

  const printArea = findPrintShellPrintArea();
  const previewArea = findPreviewShellPrintArea();
  const textLen = Math.max(
    (printArea?.innerText || '').trim().length,
    (previewArea?.innerText || '').trim().length,
  );
  if (textLen < RECEIPT_PRINT_THRESHOLDS.fiscalMinTextLength) {
    throw new Error('Чек не готов для печати');
  }

  const hPrint = Math.max(
    printArea?.scrollHeight ?? 0,
    shell.scrollHeight ?? 0,
    printArea?.offsetHeight ?? 0,
  );
  const hPreview = Math.max(
    previewArea?.scrollHeight ?? 0,
    previewArea?.offsetHeight ?? 0,
    previewArea?.getBoundingClientRect?.().height ?? 0,
  );
  const h = Math.max(hPrint, hPreview);
  if (h < RECEIPT_PRINT_THRESHOLDS.fiscalMinHeightPx) {
    console.warn('[Aurent] print shell height low, using preview text ok', hPrint, hPreview);
    if (textLen < RECEIPT_PRINT_THRESHOLDS.fiscalMinTextLength) {
      throw new Error('Чек не готов для печати');
    }
  }

  const imgs = Array.from((printArea || shell).querySelectorAll('img'));
  const imgsReady =
    imgs.length === 0 ||
    imgs.every((img) => img.complete && img.naturalWidth > 0 && Boolean(img.src));
  if (!imgsReady) {
    throw new Error('Чек не готов для печати');
  }
}

/** QR в print-shell (не зависит от превью в слоте). */
export async function waitForPrintShellQrReady(
  maxMs = RECEIPT_AUTO_PRINT_UI.qrWaitMaxMs,
  { required = false } = {},
) {
  const { fiscalPrintShellId, previewShellId, previewMountId, qrImageSelector } =
    RECEIPT_PRINT_DOM;
  const selectors = [
    `#${RECEIPT_PRINT_DOM.bodyPrintHostId} #${fiscalPrintShellId} ${qrImageSelector}`,
    `#${previewMountId} #${previewShellId} ${qrImageSelector}`,
  ];
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    for (const sel of selectors) {
      const img = document.querySelector(sel);
      if (img && img.complete && img.naturalWidth > 0 && img.src) {
        return img.src;
      }
    }
    if (!getAutoPrintFiscalShell()) {
      await sleep(RECEIPT_AUTO_PRINT_UI.qrShellMissingPollMs);
      continue;
    }
    await sleep(RECEIPT_AUTO_PRINT_UI.qrPollIntervalMs);
  }
  if (required) {
    throw new Error('Чек не готов для печати');
  }
  return null;
}

export function findReceiptPrintArea({ preferFiscalShell = false, previewOnly = false } = {}) {
  const { fiscalPrintShellId, previewShellId, receiptPrintAreaId, printRootSelectors } =
    RECEIPT_PRINT_DOM;

  if (previewOnly || preferFiscalShell) {
    const shell = previewOnly
      ? findPreviewShell()
      : findPreviewShell() || document.getElementById(fiscalPrintShellId);
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
    findPreviewShell() ||
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

/** Ждём готовности DOM чека (модалка / тест / превью). */
export async function waitForReceiptDomReady({ useModalShell = false } = {}) {
  const preferPreview =
    useModalShell ||
    Boolean(findPreviewShell()) ||
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
    if (
      imgs.length === 0 ||
      imgs.every((img) => img.complete && (img.naturalWidth > 0 || !img.src))
    ) {
      return;
    }
    await sleep(RECEIPT_PRINT_ENGINE.domReadyPollIntervalMs);
  }
}

export async function waitForFiscalPrintShellReady(
  maxMs = RECEIPT_PRINT_ENGINE.bodyImageWaitMaxMs,
) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    try {
      assertFiscalPrintShellReady();
      return;
    } catch {
      await sleep(RECEIPT_PRINT_ENGINE.domReadyPollIntervalMs);
    }
  }
  assertFiscalPrintShellReady();
}

export function assertFiscalPrintShellReady() {
  const shell = getAutoPrintFiscalShell();
  const root = document.getElementById('root');

  if (!shell) {
    console.warn('[Aurent] fiscal shell missing');
    throw new Error('Чек не найден для печати');
  }
  if (root?.contains(shell)) {
    console.warn('[Aurent] fiscal shell inside #root — need body mount');
    throw new Error('Чек не найден для печати');
  }
  const area =
    shell.querySelector(`#${RECEIPT_PRINT_DOM.receiptPrintAreaId}`) ||
    shell.querySelector('.receipt-print-root') ||
    shell;
  const textLen = (area.innerText || area.textContent || '').trim().length;
  // scrollHeight надёжен для off-screen mount; getBoundingClientRect часто 0
  const h = Math.max(
    area.scrollHeight,
    shell.scrollHeight,
    area.offsetHeight,
    area.getBoundingClientRect().height,
  );
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
    console.warn('[Aurent] body print shell: height too small', h, 'scrollH', area.scrollHeight);
    throw new Error('Чек не готов для печати');
  }
}
