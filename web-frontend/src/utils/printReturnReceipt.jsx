import React from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/config';
import FiscalReceiptBody from '../components/receipt/FiscalReceiptBody';
import { RECEIPT_PRINT_DOM } from '../config/receiptPrintConfig';
import {
  isCashierEscposPrintAvailable,
  printFiscalReceipt,
} from '../services/cashierEscpos';
import { buildReturnReceiptSale } from './buildReturnReceiptSale';
import { printThermalReceiptDialog } from './printReceipt';
import toast from 'react-hot-toast';
import { CASHIER_ESCPOS_TOAST } from '../config/cashierEscposConfig';
import { resolveEscposPrintErrorMessage } from '../services/cashierEscpos';

const EPHEMERAL_HOST_ID = 'return-receipt-ephemeral-host';

/**
 * Печать чека возврата после оформления на кассе.
 * @param {{ originalSale: object, qtyByItemId: Record<string, number>, reason?: string, t: Function }} opts
 */
export async function printReturnReceipt({ originalSale, qtyByItemId, reason, t }) {
  const returnSale = buildReturnReceiptSale(originalSale, qtyByItemId, { reason });
  if (!returnSale?.items?.length) {
    throw new Error('No return lines for receipt print');
  }

  if (isCashierEscposPrintAvailable()) {
    return printFiscalReceipt({ sale: returnSale, t });
  }

  const existing = document.getElementById(EPHEMERAL_HOST_ID);
  if (existing) existing.remove();

  const host = document.createElement('div');
  host.id = EPHEMERAL_HOST_ID;
  host.className = 'fiscal-print-scene';
  host.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none;';
  host.innerHTML = `<div class="fiscal-print-dialog"><div id="${RECEIPT_PRINT_DOM.fiscalPrintShellId}"></div></div>`;
  document.body.appendChild(host);

  const shell = document.getElementById(RECEIPT_PRINT_DOM.fiscalPrintShellId);
  const root = createRoot(shell);

  root.render(
    <I18nextProvider i18n={i18n}>
      <FiscalReceiptBody sale={returnSale} />
    </I18nextProvider>,
  );

  try {
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
    await printThermalReceiptDialog({ useModalShell: true });
    return { mode: 'dialog' };
  } finally {
    root.unmount();
    host.remove();
  }
}

/** Печать чека возврата с toast (касса, «Мои продажи», журнал). */
export async function printReturnReceiptWithToast({ originalSale, qtyByItemId, reason, t }) {
  try {
    await printReturnReceipt({ originalSale, qtyByItemId, reason, t });
    toast.success(t('receipt.printSent'), {
      id: CASHIER_ESCPOS_TOAST.toastId,
      duration: CASHIER_ESCPOS_TOAST.successDurationMs,
    });
  } catch (err) {
    toast.error(resolveEscposPrintErrorMessage(err, t) ?? t('receipt.printFailed'), {
      id: CASHIER_ESCPOS_TOAST.toastId,
      duration: CASHIER_ESCPOS_TOAST.errorDurationMs,
    });
  }
}
