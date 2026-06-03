/**
 * Рендер чека в стабильный print-host на document.body (принтер)
 * и опционально в слот превью на кассе (только UI).
 */
import { createRoot } from 'react-dom/client';
import FiscalReceiptBody from '../../components/receipt/FiscalReceiptBody';
import { RECEIPT_PRINT_DOM } from '../../config/receiptPrintConfig';
import {
  ensureStablePrintHost,
  fiscalPrintDialogClass,
  getAutoPrintPreviewMountEl,
  mountPreviewInSlotPublic,
} from '../../utils/autoPrintMount';

const { previewShellId: PREVIEW_SHELL_ID, fiscalPrintShellId: PRINT_SHELL_ID } = RECEIPT_PRINT_DOM;

/** @type {import('react-dom/client').Root|null} */
let printRoot = null;
/** @type {import('react-dom/client').Root|null} */
let previewRoot = null;
/** @type {HTMLElement|null} */
let printShellEl = null;
/** @type {HTMLElement|null} */
let previewShellEl = null;

function buildShell(parent, shellId) {
  const dialog = document.createElement('div');
  dialog.className = fiscalPrintDialogClass;
  const shell = document.createElement('div');
  shell.id = shellId;
  dialog.appendChild(shell);
  parent.replaceChildren();
  parent.appendChild(dialog);
  return shell;
}

function remountRoot(existingRoot, shellEl, sale) {
  try {
    existingRoot?.unmount();
  } catch {
    /* ignore */
  }
  const root = createRoot(shellEl);
  root.render(<FiscalReceiptBody sale={sale} />);
  return root;
}

/** Единственный источник для Electron — всегда body, вне #root. */
export function renderToPrintHost(sale) {
  const host = ensureStablePrintHost();
  printShellEl = buildShell(host, PRINT_SHELL_ID);
  printRoot = remountRoot(printRoot, printShellEl, sale);
  void printShellEl.offsetHeight;
  void host.offsetHeight;
  return printShellEl;
}

/** Превью для кассира — только если слот на странице подключён. */
export function renderPreviewToSlot(sale) {
  const slot = document.getElementById(RECEIPT_PRINT_DOM.autoPrintSlotId);
  if (!slot?.isConnected) return null;

  const host = getAutoPrintPreviewMountEl();
  mountPreviewInSlotPublic(host);
  previewShellEl = buildShell(host, PREVIEW_SHELL_ID);
  previewRoot = remountRoot(previewRoot, previewShellEl, sale);
  return previewShellEl;
}

export function getPrintShellElement() {
  return printShellEl || document.querySelector(`#${RECEIPT_PRINT_DOM.bodyPrintHostId} #${PRINT_SHELL_ID}`);
}

export function teardownRenderer() {
  try {
    printRoot?.unmount();
  } catch {
    /* ignore */
  }
  try {
    previewRoot?.unmount();
  } catch {
    /* ignore */
  }
  printRoot = null;
  previewRoot = null;
  printShellEl = null;
  previewShellEl = null;
  document.getElementById(RECEIPT_PRINT_DOM.previewMountId)?.remove();
}
