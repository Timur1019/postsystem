/**
 * DOM автопечати: превью в слоте + печать на body.
 *
 * Превью (экран)  → #pos-auto-print-preview-mount / #fiscal-print-shell-live
 * Печать (Electron) → #pos-auto-print-mount / #fiscal-print-shell (копия + capture)
 */
import { RECEIPT_AUTO_PRINT_UI, RECEIPT_PRINT_DOM, RECEIPT_PRINT_STYLES } from '../config/receiptPrintConfig';

const {
  autoPrintMountId: PRINT_MOUNT_ID,
  previewMountId: PREVIEW_MOUNT_ID,
  autoPrintSlotId: SLOT_ID,
  previewShellId: PREVIEW_SHELL_ID,
  fiscalPrintShellId: PRINT_SHELL_ID,
  fiscalPrintDialogClass,
  autoPrintHostClass,
} = RECEIPT_PRINT_DOM;

const {
  hostEmbeddedClass,
  hostInSlotClass,
  hostBodyPrintClass,
  hostCapturingClass,
} = RECEIPT_PRINT_STYLES;

let pendingUnmountTimer = null;

function clearHostInlineStyles(hostEl) {
  hostEl.style.position = '';
  hostEl.style.left = '';
  hostEl.style.right = '';
  hostEl.style.top = '';
  hostEl.style.opacity = '';
  hostEl.style.zIndex = '';
  hostEl.style.visibility = '';
}

function mountPreviewInSlot(hostEl) {
  hostEl.classList.remove(
    'fiscal-print-scene',
    'fiscal-print-scene--offscreen',
    hostBodyPrintClass,
    hostCapturingClass,
    RECEIPT_PRINT_STYLES.hostCenteredClass,
    'pos-auto-print-host--in-pay',
    'pos-auto-print-host--in-actions',
  );
  hostEl.classList.add(autoPrintHostClass, hostEmbeddedClass, hostInSlotClass);
  clearHostInlineStyles(hostEl);

  const slot = document.getElementById(SLOT_ID);
  if (slot) {
    slot.appendChild(hostEl);
    return;
  }
  const fallback =
    document.querySelector('.cashier-register__actions-col--pay .pos-pay-panel__scroll') ||
    document.querySelector('.cashier-register__actions-col');
  (fallback || document.body).appendChild(hostEl);
}

export function ensureAutoPrintMountInSlot() {
  const el = document.getElementById(PREVIEW_MOUNT_ID);
  const slot = document.getElementById(SLOT_ID);
  if (el && slot && !slot.contains(el)) {
    mountPreviewInSlot(el);
  }
}

/** Превью чека в правой колонке (React). */
export function getAutoPrintPreviewMountEl() {
  let el = document.getElementById(PREVIEW_MOUNT_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = PREVIEW_MOUNT_ID;
    el.className = `pos-sale-print-host ${autoPrintHostClass}`;
    el.setAttribute('aria-live', 'polite');
    mountPreviewInSlot(el);
  } else {
    mountPreviewInSlot(el);
  }
  return el;
}

/** @deprecated alias */
export function getAutoPrintMountEl() {
  return getAutoPrintPreviewMountEl();
}

function ensureBodyPrintMount() {
  let el = document.getElementById(PRINT_MOUNT_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = PRINT_MOUNT_ID;
    el.className = `pos-sale-print-host ${autoPrintHostClass} ${hostBodyPrintClass}`;
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  } else {
    el.classList.remove(
      hostEmbeddedClass,
      hostInSlotClass,
      RECEIPT_PRINT_STYLES.hostCenteredClass,
      'fiscal-print-scene',
      'fiscal-print-scene--offscreen',
    );
    el.classList.add(hostBodyPrintClass);
    if (el.parentElement !== document.body) {
      document.body.appendChild(el);
    }
  }
  return el;
}

export function findLivePreviewShell() {
  const previewMount = document.getElementById(PREVIEW_MOUNT_ID);
  return (
    previewMount?.querySelector(`#${PREVIEW_SHELL_ID}`) ||
    document.getElementById(PREVIEW_SHELL_ID) ||
    null
  );
}

export function getAutoPrintFiscalShell() {
  const printMount = document.getElementById(PRINT_MOUNT_ID);
  const shell = printMount?.querySelector(`#${PRINT_SHELL_ID}`);
  if (shell && !document.getElementById('root')?.contains(shell)) {
    return shell;
  }
  return null;
}

async function syncPrintShellImagesFromPreview(liveShell, printShell) {
  const liveImgs = Array.from(liveShell.querySelectorAll('img'));
  const printImgs = Array.from(printShell.querySelectorAll('img'));
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
          /* fallback */
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

/** Копия превью на body перед silent print (Electron). */
export async function prepareBodyPrintShellFromPreview() {
  const liveShell = findLivePreviewShell();
  if (!liveShell) {
    return () => {};
  }

  const host = ensureBodyPrintMount();
  host.style.display = 'block';
  host.replaceChildren();

  const dialog = document.createElement('div');
  dialog.className = fiscalPrintDialogClass;

  const printShell = document.createElement('div');
  printShell.id = PRINT_SHELL_ID;
  printShell.innerHTML = liveShell.innerHTML;

  dialog.appendChild(printShell);
  host.appendChild(dialog);

  await syncPrintShellImagesFromPreview(liveShell, printShell);
  void printShell.offsetHeight;

  return () => {
    destroyBodyPrintMount();
  };
}

/** Убирает body-mount за экран (не display:none — ломает measure/assert). */
export function hideBodyPrintMountFromScreen(host = document.getElementById(PRINT_MOUNT_ID)) {
  if (!host) return;
  host.classList.remove(hostCapturingClass);
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.pointerEvents = 'none';
  host.style.zIndex = '-1';
  host.style.display = 'block';
}

function showBodyPrintMountForCapture(host = document.getElementById(PRINT_MOUNT_ID)) {
  if (!host) return;
  host.style.display = 'block';
  host.style.opacity = '';
  host.style.visibility = '';
  host.style.overflow = '';
  host.style.pointerEvents = 'none';
  hideBodyPrintMountFromScreen(host);
}

export function destroyBodyPrintMount() {
  const host = document.getElementById(PRINT_MOUNT_ID);
  if (!host) return;
  host.classList.remove(hostCapturingClass);
  try {
    host.replaceChildren();
  } catch {
    /* ignore */
  }
  host.remove();
}

/** Перед webContents.print — body-mount остаётся off-screen (Electron печатает без left:0). */
export function prepareMountForSilentCapture() {
  const mount = document.getElementById(PRINT_MOUNT_ID);
  if (!mount) return () => {};
  showBodyPrintMountForCapture(mount);
  mount.classList.add(hostCapturingClass);
  void mount.offsetHeight;
  const shell = mount.querySelector(`#${PRINT_SHELL_ID}`);
  if (shell) void shell.offsetHeight;
  return () => {
    mount.classList.remove(hostCapturingClass);
    hideBodyPrintMountFromScreen(mount);
  };
}

export function cancelScheduledAutoPrintUnmount() {
  if (pendingUnmountTimer != null) {
    clearTimeout(pendingUnmountTimer);
    pendingUnmountTimer = null;
  }
}

export function scheduleAutoPrintUnmount(
  unmountFn,
  delayMs = RECEIPT_AUTO_PRINT_UI.defaultUnmountDelayMs,
) {
  cancelScheduledAutoPrintUnmount();
  pendingUnmountTimer = setTimeout(() => {
    pendingUnmountTimer = null;
    unmountFn();
  }, delayMs);
}

export function teardownAutoPrintMount() {
  cancelScheduledAutoPrintUnmount();
  document.getElementById(PREVIEW_MOUNT_ID)?.remove();
  const printEl = document.getElementById(PRINT_MOUNT_ID);
  if (printEl) {
    try {
      printEl.replaceChildren();
    } catch {
      /* ignore */
    }
    printEl.remove();
  }
}

export {
  PRINT_MOUNT_ID as MOUNT_ID,
  PREVIEW_MOUNT_ID,
  PREVIEW_SHELL_ID,
  PRINT_SHELL_ID,
  fiscalPrintDialogClass,
};
