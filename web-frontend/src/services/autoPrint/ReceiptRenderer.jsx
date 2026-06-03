/**
 * Один React-рендер чека в print-host на body; превью — клон готового DOM (без второго root).
 */
import { createRoot } from 'react-dom/client';
import FiscalReceiptBody from '../../components/receipt/FiscalReceiptBody';
import { RECEIPT_PRINT_DOM } from '../../config/receiptPrintConfig';
import {
  ensureStablePrintHost,
  fiscalPrintDialogClass,
  getAutoPrintPreviewMountEl,
  mountPreviewInSlotPublic,
  syncShellImagesBetween,
} from '../../utils/autoPrintMount';

const {
  previewShellId: PREVIEW_SHELL_ID,
  fiscalPrintShellId: PRINT_SHELL_ID,
  receiptPrintAreaId: RECEIPT_AREA_ID,
} = RECEIPT_PRINT_DOM;

/** @type {import('react-dom/client').Root|null} */
let printRoot = null;
/** @type {HTMLElement|null} */
let printShellEl = null;

function ensureShellInHost(host, shellId) {
  let dialog = host.querySelector(`.${fiscalPrintDialogClass}`);
  if (!dialog) {
    host.replaceChildren();
    dialog = document.createElement('div');
    dialog.className = fiscalPrintDialogClass;
    host.appendChild(dialog);
  }
  let shell = dialog.querySelector(`#${shellId}`);
  if (!shell) {
    dialog.replaceChildren();
    shell = document.createElement('div');
    shell.id = shellId;
    dialog.appendChild(shell);
  }
  return shell;
}

/** Единственный React-рендер — print-host на body (Electron). */
export function renderToPrintHost(sale) {
  const host = ensureStablePrintHost();
  printShellEl = ensureShellInHost(host, PRINT_SHELL_ID);
  if (!printRoot) {
    printRoot = createRoot(printShellEl);
  }
  printRoot.render(<FiscalReceiptBody sale={sale} />);
  void printShellEl.offsetHeight;
  void host.offsetHeight;
  return printShellEl;
}

/** Превью в слоте — клон уже готового print-shell (после QR/layout). */
export async function syncPreviewFromPrintShell() {
  const liveShell = getPrintShellElement();
  if (!liveShell) return null;

  const slot = document.getElementById(RECEIPT_PRINT_DOM.autoPrintSlotId);
  if (!slot?.isConnected) return null;

  const host = getAutoPrintPreviewMountEl();
  mountPreviewInSlotPublic(host);
  const previewShell = ensureShellInHost(host, PREVIEW_SHELL_ID);
  previewShell.innerHTML = liveShell.innerHTML;

  const clonedArea = previewShell.querySelector(`#${RECEIPT_AREA_ID}`);
  if (clonedArea) {
    clonedArea.id = `${RECEIPT_AREA_ID}-live`;
  }

  await syncShellImagesBetween(liveShell, previewShell);
  void previewShell.offsetHeight;
  return previewShell;
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
  document.getElementById(RECEIPT_PRINT_DOM.previewMountId)?.remove();
}
