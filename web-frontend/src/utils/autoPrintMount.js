/**
 * DOM автопечати: превью в слоте кассы + полная копия на body для Electron.
 *
 * Превью (экран)  → #pos-auto-print-preview-mount / #fiscal-print-shell-live
 * Печать (Electron) → #pos-auto-print-print-host / #fiscal-print-shell на document.body (off-screen)
 *
 * «Справочник» — логически отдельная полоса печати: кассир на /pos её не видит,
 * layout полный (как раньше слева), принтер измеряет scrollHeight. После печати DOM удаляется.
 */
import { RECEIPT_AUTO_PRINT_UI, RECEIPT_PRINT_DOM, RECEIPT_PRINT_STYLES } from '../config/receiptPrintConfig';

const {
  bodyPrintHostId: PRINT_HOST_ID,
  handbookPrintSlotId: HANDBOOK_PRINT_SLOT_ID,
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
  hostPreviewParkClass,
  hostCapturingClass,
} = RECEIPT_PRINT_STYLES;

/** Legacy id — удаляем при teardown */
const LEGACY_PRINT_MOUNT_ID = RECEIPT_PRINT_DOM.autoPrintMountId;
const LEGACY_SUPPORT_LANE_ID = 'pos-auto-print-print-support-lane';
const LEGACY_HANDBOOK_AREA_ID = RECEIPT_PRINT_DOM.handbookPrintAreaId;

let pendingUnmountTimer = null;
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
  if (owner) {
    hostEl.dataset.printOwner = owner;
  } else {
    delete hostEl.dataset.printOwner;
  }
}

function destroyPrintMountIfWrongOwner() {
  const host = document.getElementById(PRINT_HOST_ID);
  if (!host?.dataset.printOwner) return;
  const owner = getPrintOwnerKey();
  if (owner && host.dataset.printOwner !== owner) {
    destroyBodyPrintMount();
  }
}

function removeLegacyPrintContainers() {
  document.getElementById(LEGACY_PRINT_MOUNT_ID)?.remove();
  document.getElementById(LEGACY_SUPPORT_LANE_ID)?.remove();
  document.getElementById(LEGACY_HANDBOOK_AREA_ID)?.remove();
  document.getElementById(HANDBOOK_PRINT_SLOT_ID)?.replaceChildren();
}

function clearHostInlineStyles(hostEl) {
  hostEl.style.position = '';
  hostEl.style.left = '';
  hostEl.style.right = '';
  hostEl.style.top = '';
  hostEl.style.opacity = '';
  hostEl.style.zIndex = '';
  hostEl.style.visibility = '';
  hostEl.style.display = '';
  hostEl.style.width = '';
  hostEl.style.maxWidth = '';
  hostEl.style.overflow = '';
}

function mountPreviewOnBodyPark(hostEl) {
  hostEl.classList.remove(
    'fiscal-print-scene',
    'fiscal-print-scene--offscreen',
    hostBodyPrintClass,
    hostCapturingClass,
    hostEmbeddedClass,
    hostInSlotClass,
    RECEIPT_PRINT_STYLES.hostCenteredClass,
    'pos-auto-print-host--in-pay',
    'pos-auto-print-host--in-actions',
  );
  hostEl.classList.add(autoPrintHostClass, hostPreviewParkClass);
  clearHostInlineStyles(hostEl);
  if (hostEl.parentElement !== document.body) {
    document.body.appendChild(hostEl);
  }
}

function mountPreviewInSlot(hostEl) {
  const slot = document.getElementById(SLOT_ID);
  if (!slot?.isConnected) {
    if (isAutoPrintInFlight()) {
      mountPreviewOnBodyPark(hostEl);
      return;
    }
  }

  hostEl.classList.remove(
    'fiscal-print-scene',
    'fiscal-print-scene--offscreen',
    hostBodyPrintClass,
    hostCapturingClass,
    hostPreviewParkClass,
    RECEIPT_PRINT_STYLES.hostCenteredClass,
    'pos-auto-print-host--in-pay',
    'pos-auto-print-host--in-actions',
  );
  hostEl.classList.add(autoPrintHostClass, hostEmbeddedClass, hostInSlotClass);
  clearHostInlineStyles(hostEl);

  if (slot?.isConnected) {
    slot.appendChild(hostEl);
    return;
  }
  const fallback =
    document.querySelector('.cashier-register__actions-col--pay .pos-pay-panel__scroll') ||
    document.querySelector('.cashier-register__actions-col');
  (fallback || document.body).appendChild(hostEl);
}

/** Сохранить превью на body, если слот кассы размонтирован (уход со /pos). */
export function parkPreviewMountOnBody() {
  const host = document.getElementById(PREVIEW_MOUNT_ID);
  if (!host) return;
  const slot = document.getElementById(SLOT_ID);
  if (slot?.isConnected && slot.contains(host)) return;
  mountPreviewOnBodyPark(host);
}

export function ensureAutoPrintMountInSlot() {
  const el = document.getElementById(PREVIEW_MOUNT_ID);
  if (!el) return;
  const slot = document.getElementById(SLOT_ID);
  if (slot?.isConnected && slot.contains(el)) return;
  mountPreviewInSlot(el);
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

/** Print-host на body (вне #root), полный layout off-screen — для Electron. */
function ensureBodyPrintMount() {
  removeLegacyPrintContainers();
  destroyPrintMountIfWrongOwner();

  let el = document.getElementById(PRINT_HOST_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = PRINT_HOST_ID;
    el.className = `pos-sale-print-host ${autoPrintHostClass} ${hostBodyPrintClass}`;
    el.setAttribute('aria-hidden', 'true');
    stampPrintOwner(el);
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
    clearHostInlineStyles(el);
    stampPrintOwner(el);
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
  const printHost =
    document.getElementById(PRINT_HOST_ID) || document.getElementById(LEGACY_PRINT_MOUNT_ID);
  const shell = printHost?.querySelector(`#${PRINT_SHELL_ID}`);
  if (shell) return shell;

  const root = document.getElementById('root');
  return (
    Array.from(document.querySelectorAll(`#${PRINT_SHELL_ID}`)).find(
      (el) => !root?.contains(el),
    ) ?? null
  );
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
  parkPreviewMountOnBody();
  const liveShell = findLivePreviewShell();
  if (!liveShell) {
    return () => {};
  }

  const host = ensureBodyPrintMount();
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
  void host.offsetHeight;

  return () => {
    destroyBodyPrintMount();
  };
}

/** @deprecated */
export function finalizeHandbookPrintMount() {
  destroyBodyPrintMount();
}

/** @deprecated */
export function hidePrintSupportLane() {}

/** @deprecated */
export function hideBodyPrintMountFromScreen() {
  hidePrintSupportLane();
}

function preparePrintHostForCapture(host = document.getElementById(PRINT_HOST_ID)) {
  if (!host) return;
  host.classList.add(hostCapturingClass);
  void host.offsetHeight;
  const shell = host.querySelector(`#${PRINT_SHELL_ID}`);
  if (shell) void shell.offsetHeight;
}

export function destroyBodyPrintMount({ force = false } = {}) {
  if (!force && isAutoPrintInFlight()) return;
  for (const id of [PRINT_HOST_ID, LEGACY_PRINT_MOUNT_ID]) {
    const host = document.getElementById(id);
    if (!host) continue;
    host.classList.remove(hostCapturingClass);
    try {
      host.replaceChildren();
    } catch {
      /* ignore */
    }
    host.remove();
  }
  removeLegacyPrintContainers();
}

/** Перед webContents.print — print-host остаётся off-screen на body, layout полный. */
export function prepareMountForSilentCapture() {
  const mount = document.getElementById(PRINT_HOST_ID);
  if (!mount) return () => {};
  preparePrintHostForCapture(mount);
  return () => {
    mount.classList.remove(hostCapturingClass);
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

export function teardownAutoPrintMount({ force = false } = {}) {
  cancelScheduledAutoPrintUnmount();
  if (!force && isAutoPrintInFlight()) return;
  document.getElementById(PREVIEW_MOUNT_ID)?.remove();
  destroyBodyPrintMount({ force: true });
}

export {
  PRINT_HOST_ID as MOUNT_ID,
  PRINT_HOST_ID,
  LEGACY_HANDBOOK_AREA_ID as HANDBOOK_PRINT_AREA_ID,
  HANDBOOK_PRINT_SLOT_ID,
  PREVIEW_MOUNT_ID,
  PREVIEW_SHELL_ID,
  PRINT_SHELL_ID,
  fiscalPrintDialogClass,
};
