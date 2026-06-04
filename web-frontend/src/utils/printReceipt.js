/**
 * Печать фискального чека через диалог браузера (window.print).
 * На desktop-кассе для продаж используйте printFiscalReceipt из services/cashierEscpos.
 */
import { RECEIPT_PRINT_DOM } from '../config/receiptPrintConfig';
import {
  assertFiscalPrintShellReady,
  waitForDoubleAnimationFrame,
  waitForReceiptDomReady,
  waitForReceiptPaintSettled,
} from './receiptPrintWait';
import {
  prepareThermalPrint,
  PRINT_THERMAL_CLASS,
  PRINT_THERMAL_MODAL_CLASS,
} from './printWithHtmlClass';

export function isDesktopCashier() {
  return typeof window !== 'undefined' && Boolean(window.desktopCashier?.isDesktop);
}

export function clearReceiptPrintCaptureOverrides() {
  if (typeof document === 'undefined') return;
  document.documentElement.style.removeProperty('background-color');
  document.body.style.removeProperty('background-color');
}

export function restoreCashierUiAfterPrintJob() {
  if (typeof document === 'undefined') return;
  [PRINT_THERMAL_CLASS, PRINT_THERMAL_MODAL_CLASS].forEach((c) =>
    document.documentElement.classList.remove(c),
  );
  document.getElementById(RECEIPT_PRINT_DOM.printJobPageStyleId)?.remove();
  clearReceiptPrintCaptureOverrides();
}

export function cleanupDesktopPrintState() {
  restoreCashierUiAfterPrintJob();
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

export async function printThermalReceipt({ useModalShell, receiptNumber: _receiptNumber = null } = {}) {
  await printThermalReceiptDialog({ useModalShell });
  return 'dialog';
}

export async function printReceipt(receiptNumber, { preferSilent: _preferSilent = true } = {}) {
  return printThermalReceipt({ receiptNumber });
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
    await waitForReceiptDomReady({ useModalShell: true });
    await waitForReceiptPaintSettled();
    assertFiscalPrintShellReady();
    await printThermalReceiptDialog({ useModalShell: true });
  } finally {
    host.remove();
  }
}
