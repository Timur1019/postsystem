/**
 * DOM автопечати:
 *   экран  → #pos-auto-print-preview-mount / #fiscal-print-shell-live
 *   печать → #pos-auto-print-print-host / #fiscal-print-shell (document.body, off-screen)
 */
import { RECEIPT_PRINT_DOM, RECEIPT_PRINT_STYLES } from '../config/receiptPrintConfig';

const {
  bodyPrintHostId: PRINT_HOST_ID,
  previewMountId: PREVIEW_MOUNT_ID,
  previewShellId: PREVIEW_SHELL_ID,
  fiscalPrintShellId: PRINT_SHELL_ID,
  fiscalPrintDialogClass,
  autoPrintHostClass,
  staleDomIds,
} = RECEIPT_PRINT_DOM;

const { hostBodyPrintClass, hostScreenPreviewClass, hostCapturingClass } = RECEIPT_PRINT_STYLES;

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

export function mountPreviewScreenCentered(hostEl) {
  hostEl.className = `pos-sale-print-host ${autoPrintHostClass} ${hostScreenPreviewClass}`;
  clearHostInlineStyles(hostEl);
  if (hostEl.parentElement !== document.body) {
    document.body.appendChild(hostEl);
  }
}

export function ensureStablePrintHost() {
  removeStaleDom();
  destroyPrintMountIfWrongOwner();

  let el = document.getElementById(PRINT_HOST_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = PRINT_HOST_ID;
    el.className = `pos-sale-print-host fiscal-print-scene ${autoPrintHostClass} ${hostBodyPrintClass}`;
    el.setAttribute('aria-hidden', 'true');
    stampPrintOwner(el);
    document.body.appendChild(el);
  } else {
    el.className = `pos-sale-print-host fiscal-print-scene ${autoPrintHostClass} ${hostBodyPrintClass}`;
    clearHostInlineStyles(el);
    stampPrintOwner(el);
    if (el.parentElement !== document.body) {
      document.body.appendChild(el);
    }
  }
  return el;
}

export function getAutoPrintPreviewMountEl() {
  let el = document.getElementById(PREVIEW_MOUNT_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = PREVIEW_MOUNT_ID;
    el.setAttribute('aria-live', 'polite');
    mountPreviewScreenCentered(el);
  } else {
    mountPreviewScreenCentered(el);
  }
  return el;
}

export function findPreviewShell() {
  const mount = document.getElementById(PREVIEW_MOUNT_ID);
  return mount?.querySelector(`#${PREVIEW_SHELL_ID}`) ?? document.getElementById(PREVIEW_SHELL_ID);
}

export function getAutoPrintFiscalShell() {
  const host = document.getElementById(PRINT_HOST_ID);
  const shell = host?.querySelector(`#${PRINT_SHELL_ID}`);
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
          /* use src below */
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

export function prepareMountForSilentCapture() {
  const host = document.getElementById(PRINT_HOST_ID);
  if (!host) return () => {};
  host.classList.add(hostCapturingClass);
  const prevLeft = host.style.left;
  host.style.left = '-10000px';
  host.style.opacity = '1';
  host.style.visibility = 'visible';
  host.style.background = '#ffffff';
  host.style.color = '#000000';
  const shell = host.querySelector(`#${PRINT_SHELL_ID}`);
  if (shell) {
    shell.style.background = '#ffffff';
    shell.style.color = '#000000';
    void shell.offsetHeight;
  }
  void host.offsetHeight;
  return () => {
    host.classList.remove(hostCapturingClass);
    host.style.left = prevLeft;
    host.style.opacity = '';
    host.style.visibility = '';
    host.style.background = '';
    host.style.color = '';
    if (shell) {
      shell.style.background = '';
      shell.style.color = '';
    }
  };
}

export function destroyBodyPrintMount({ force = false } = {}) {
  if (!force && autoPrintInFlight) return;
  const host = document.getElementById(PRINT_HOST_ID);
  if (host) {
    host.classList.remove(hostCapturingClass);
    host.replaceChildren();
    host.remove();
  }
  removeStaleDom();
}

export function teardownAutoPrintDom({ force = false } = {}) {
  if (!force && autoPrintInFlight) return;
  document.getElementById(PREVIEW_MOUNT_ID)?.remove();
  destroyBodyPrintMount({ force: true });
}

export {
  PRINT_HOST_ID,
  PREVIEW_MOUNT_ID,
  PREVIEW_SHELL_ID,
  PRINT_SHELL_ID,
  fiscalPrintDialogClass,
};
