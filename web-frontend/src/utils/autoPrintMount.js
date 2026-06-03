/**
 * Экран: #pos-auto-print-print-host — компактный чек по центру.
 * Печать: #pos-auto-print-print-host-capture — клон off-screen (не мигает на экране).
 */
import { RECEIPT_PRINT_DOM, RECEIPT_PRINT_STYLES } from '../config/receiptPrintConfig';

const {
  bodyPrintHostId: PRINT_HOST_ID,
  capturePrintHostId: CAPTURE_HOST_ID,
  fiscalPrintShellId: PRINT_SHELL_ID,
  captureFiscalShellId: CAPTURE_SHELL_ID,
  fiscalPrintDialogClass,
  autoPrintHostClass,
  staleDomIds,
} = RECEIPT_PRINT_DOM;

const { hostBodyPrintClass, hostOnScreenClass, hostPrintingClass } = RECEIPT_PRINT_STYLES;

let autoPrintInFlight = false;

export function setAutoPrintInFlight(active) {
  autoPrintInFlight = Boolean(active);
}

export function isAutoPrintInFlight() {
  return autoPrintInFlight;
}

function getPrintOwnerKey() {
  try {
    const raw = localStorage.getItem('pos-auth');
    const user = raw ? JSON.parse(raw)?.state?.user : null;
    return user?.id != null ? String(user.id) : user?.username ?? null;
  } catch {
    return null;
  }
}

function stampPrintOwner(hostEl) {
  const owner = getPrintOwnerKey();
  if (owner) hostEl.dataset.printOwner = owner;
  else delete hostEl.dataset.printOwner;
}

function clearHostInlineStyles(hostEl) {
  hostEl.removeAttribute('style');
}

export function removeStaleDom() {
  for (const id of staleDomIds) {
    document.getElementById(id)?.remove();
  }
}

function destroyPrintMountIfWrongOwner() {
  const host = document.getElementById(PRINT_HOST_ID);
  if (!host?.dataset.printOwner) return;
  const owner = getPrintOwnerKey();
  if (owner && host.dataset.printOwner !== owner) {
    destroyBodyPrintMount({ force: true });
  }
}

function applyOnScreenHostClasses(hostEl) {
  hostEl.className = `pos-sale-print-host fiscal-print-scene ${autoPrintHostClass} ${hostBodyPrintClass} ${hostOnScreenClass}`;
  clearHostInlineStyles(hostEl);
}

export function ensureStablePrintHost() {
  removeStaleDom();
  destroyPrintMountIfWrongOwner();

  let el = document.getElementById(PRINT_HOST_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = PRINT_HOST_ID;
    el.setAttribute('aria-live', 'polite');
    stampPrintOwner(el);
    document.body.appendChild(el);
  } else {
    stampPrintOwner(el);
    if (el.parentElement !== document.body) {
      document.body.appendChild(el);
    }
  }
  applyOnScreenHostClasses(el);
  return el;
}

/** Для Electron: сначала capture-клон, иначе экранный shell. */
export function getAutoPrintFiscalShell() {
  const captureShell =
    document.getElementById(CAPTURE_SHELL_ID) ||
    document.getElementById(CAPTURE_HOST_ID)?.querySelector(`#${CAPTURE_SHELL_ID}`) ||
    document.getElementById(CAPTURE_HOST_ID)?.querySelector(`#${PRINT_SHELL_ID}`);
  if (captureShell) return captureShell;

  const shell = document.getElementById(PRINT_HOST_ID)?.querySelector(`#${PRINT_SHELL_ID}`);
  if (shell) return shell;

  const root = document.getElementById('root');
  return (
    Array.from(document.querySelectorAll(`#${PRINT_SHELL_ID}`)).find((el) => !root?.contains(el)) ??
    null
  );
}

export async function syncShellImagesBetween(sourceShell, targetShell) {
  const liveImgs = Array.from(sourceShell.querySelectorAll('img'));
  const printImgs = Array.from(targetShell.querySelectorAll('img'));
  if (liveImgs.length === 0) return;

  await Promise.all(
    liveImgs.map(async (liveImg, index) => {
      const printImg = printImgs[index];
      if (!printImg) return;
      const src = liveImg.currentSrc || liveImg.src;
      if (!src) return;

      if (liveImg.complete && liveImg.naturalWidth > 0) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = liveImg.naturalWidth;
          canvas.height = liveImg.naturalHeight;
          canvas.getContext('2d')?.drawImage(liveImg, 0, 0);
          printImg.src = canvas.toDataURL('image/png');
          return;
        } catch {
          /* fallback src */
        }
      }

      printImg.src = src;
      if (printImg.complete) return;
      await new Promise((resolve) => {
        printImg.onload = resolve;
        printImg.onerror = resolve;
      });
    }),
  );
}

function removeCapturePrintHost() {
  document.getElementById(CAPTURE_HOST_ID)?.remove();
}

/** Клон чека off-screen для IPC — видимый host не меняется (нет мигания). */
export async function prepareMountForSilentCapture() {
  const source = document.getElementById(PRINT_HOST_ID);
  const sourceShell = source?.querySelector(`#${PRINT_SHELL_ID}`);
  if (!sourceShell) return () => {};

  removeCapturePrintHost();

  const capture = document.createElement('div');
  capture.id = CAPTURE_HOST_ID;
  capture.className = `pos-sale-print-host fiscal-print-scene ${autoPrintHostClass} ${hostBodyPrintClass} ${hostPrintingClass}`;
  capture.setAttribute('aria-hidden', 'true');

  const dialog = document.createElement('div');
  dialog.className = fiscalPrintDialogClass;
  const printShell = document.createElement('div');
  printShell.id = CAPTURE_SHELL_ID;
  printShell.innerHTML = sourceShell.innerHTML;
  dialog.appendChild(printShell);
  capture.appendChild(dialog);
  document.body.appendChild(capture);

  await syncShellImagesBetween(sourceShell, printShell);
  void capture.offsetHeight;
  void printShell.offsetHeight;

  return removeCapturePrintHost;
}

export function destroyBodyPrintMount({ force = false } = {}) {
  if (!force && autoPrintInFlight) return;
  removeCapturePrintHost();
  const host = document.getElementById(PRINT_HOST_ID);
  if (host) {
    host.replaceChildren();
    host.remove();
  }
  removeStaleDom();
}

export function teardownAutoPrintDom({ force = false } = {}) {
  if (!force && autoPrintInFlight) return;
  destroyBodyPrintMount({ force: true });
}

export {
  PRINT_HOST_ID,
  CAPTURE_HOST_ID,
  PRINT_SHELL_ID,
  CAPTURE_SHELL_ID,
  fiscalPrintDialogClass,
};
