/**
 * Один React-рендер чека в #pos-auto-print-print-host (экран + печать).
 */
import { createRoot } from 'react-dom/client';
import FiscalReceiptBody from '../../components/receipt/FiscalReceiptBody';
import { RECEIPT_PRINT_DOM } from '../../config/receiptPrintConfig';
import { ensureStablePrintHost, fiscalPrintDialogClass } from '../../utils/autoPrintMount';

const { fiscalPrintShellId: PRINT_SHELL_ID } = RECEIPT_PRINT_DOM;

/** @type {import('react-dom/client').Root|null} */
let printRoot = null;
/** @type {HTMLElement|null} */
let printShellEl = null;

function ensureShellInHost(host) {
  let dialog = host.querySelector(`.${fiscalPrintDialogClass}`);
  if (!dialog) {
    host.replaceChildren();
    dialog = document.createElement('div');
    dialog.className = fiscalPrintDialogClass;
    host.appendChild(dialog);
  }
  let shell = dialog.querySelector(`#${PRINT_SHELL_ID}`);
  if (!shell) {
    dialog.replaceChildren();
    shell = document.createElement('div');
    shell.id = PRINT_SHELL_ID;
    dialog.appendChild(shell);
  }
  return shell;
}

export function renderToPrintHost(sale) {
  const host = ensureStablePrintHost();
  try {
    printRoot?.unmount();
  } catch {
    /* ignore */
  }
  printRoot = null;
  host.replaceChildren();
  printShellEl = ensureShellInHost(host);
  printRoot = createRoot(printShellEl);
  printRoot.render(<FiscalReceiptBody sale={sale} />);
  void printShellEl.offsetHeight;
  void host.offsetHeight;
  return printShellEl;
}

export function getPrintShellElement() {
  return (
    printShellEl ||
    document.querySelector(`#${RECEIPT_PRINT_DOM.bodyPrintHostId} #${PRINT_SHELL_ID}`)
  );
}

export function teardownRenderer() {
  try {
    printRoot?.unmount();
  } catch {
    /* ignore */
  }
  printRoot = null;
  printShellEl = null;
}
