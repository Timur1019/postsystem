/**
 * DOM автопечати: превью в слоте кассы + временная копия для Electron (off-screen).
 *
 * Превью (экран кассы) → #pos-auto-print-preview-mount / #fiscal-print-shell-live
 * Печать (Electron)    → #pos-auto-print-handbook-print-area / #pos-auto-print-print-host / #fiscal-print-shell
 * После печати DOM удаляется — в справочнике ничего не остаётся.
 */
import { RECEIPT_AUTO_PRINT_UI, RECEIPT_PRINT_DOM, RECEIPT_PRINT_STYLES } from '../config/receiptPrintConfig';

const {
  bodyPrintHostId: PRINT_HOST_ID,
  handbookPrintAreaId: HANDBOOK_PRINT_AREA_ID,
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
  hostCapturingClass,
  handbookPrintAreaClass,
} = RECEIPT_PRINT_STYLES;

const POS_HIDDEN_CLASS = `${handbookPrintAreaClass}--pos-hidden`;

/** Legacy id — удаляем при teardown */
const LEGACY_PRINT_MOUNT_ID = RECEIPT_PRINT_DOM.autoPrintMountId;
const LEGACY_SUPPORT_LANE_ID = 'pos-auto-print-print-support-lane';

let pendingUnmountTimer = null;

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

function clearHandbookPrintSlot() {
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

function isCashierPosScreen() {
  return Boolean(document.querySelector('.cashier-app--pos-screen'));
}

function hideHandbookPrintOnPosScreen() {
  const area = document.getElementById(HANDBOOK_PRINT_AREA_ID);
  if (!area) return;
  if (isCashierPosScreen()) {
    area.classList.add(POS_HIDDEN_CLASS);
    area.setAttribute('aria-hidden', 'true');
  } else {
    area.classList.remove(POS_HIDDEN_CLASS);
  }
}

function showHandbookPrintForCapture() {
  const area = document.getElementById(HANDBOOK_PRINT_AREA_ID);
  if (!area) return;
  area.classList.remove(POS_HIDDEN_CLASS);
  area.setAttribute('aria-hidden', 'true');
}

function ensureHandbookPrintArea() {
  let area = document.getElementById(HANDBOOK_PRINT_AREA_ID);
  if (!area) {
    area = document.createElement('div');
    area.id = HANDBOOK_PRINT_AREA_ID;
    area.className = `${handbookPrintAreaClass} ${POS_HIDDEN_CLASS}`;
    area.setAttribute('aria-hidden', 'true');
    document.body.appendChild(area);
  } else if (area.parentElement !== document.body) {
    document.body.appendChild(area);
    hideHandbookPrintOnPosScreen();
  } else {
    hideHandbookPrintOnPosScreen();
  }
  return area;
}

/** Контейнер печати — только off-screen fallback (не слот справочника на экране). */
export function getHandbookPrintContainer() {
  destroyPrintMountIfWrongOwner();
  return ensureHandbookPrintArea();
}

function ensureBodyPrintMount() {
  document.getElementById(LEGACY_PRINT_MOUNT_ID)?.remove();
  document.getElementById(LEGACY_SUPPORT_LANE_ID)?.remove();
  destroyPrintMountIfWrongOwner();

  const container = getHandbookPrintContainer();

  let el = document.getElementById(PRINT_HOST_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = PRINT_HOST_ID;
    el.className = `pos-sale-print-host ${autoPrintHostClass} ${hostBodyPrintClass}`;
    el.setAttribute('aria-hidden', 'true');
    stampPrintOwner(el);
    container.appendChild(el);
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
    if (el.parentElement !== container) {
      container.appendChild(el);
    }
  }
  if (container.id === HANDBOOK_PRINT_AREA_ID) {
    showHandbookPrintForCapture();
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

function isPrintLaneElement(el) {
  if (!el) return false;
  const { handbookPrintAreaId, handbookPrintSlotId, bodyPrintHostId } = RECEIPT_PRINT_DOM;
  return Boolean(
    el.closest(`#${handbookPrintAreaId}`)
      || el.closest(`#${handbookPrintSlotId}`)
      || el.closest(`#${bodyPrintHostId}`),
  );
}

export function getAutoPrintFiscalShell() {
  const printHost =
    document.getElementById(PRINT_HOST_ID) || document.getElementById(LEGACY_PRINT_MOUNT_ID);
  const shell = printHost?.querySelector(`#${PRINT_SHELL_ID}`);
  if (shell && isPrintLaneElement(shell)) {
    return shell;
  }
  const root = document.getElementById('root');
  const orphan = Array.from(document.querySelectorAll(`#${PRINT_SHELL_ID}`)).find(
    (el) => isPrintLaneElement(el) || !root?.contains(el),
  );
  return orphan ?? null;
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

/** Копия превью в справочник модулей перед silent print (Electron). */
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

/** @deprecated — сразу удаляет print-host после печати */
export function finalizeHandbookPrintMount() {
  destroyBodyPrintMount();
}

/** @deprecated alias */
export function hidePrintSupportLane() {
  /* no-op: скрытие через CSS на экране кассы */
}

/** @deprecated alias */
export function hideBodyPrintMountFromScreen() {
  hidePrintSupportLane();
}

function preparePrintHostForCapture(host = document.getElementById(PRINT_HOST_ID)) {
  if (!host) return;
  showHandbookPrintForCapture();
  host.style.display = 'block';
  host.classList.add(hostCapturingClass);
}

export function destroyBodyPrintMount() {
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
  clearHandbookPrintSlot();
  document.getElementById(LEGACY_SUPPORT_LANE_ID)?.remove();
  hideHandbookPrintOnPosScreen();
}

/** Перед webContents.print — чек в справочнике (на кассе скрыт CSS). */
export function prepareMountForSilentCapture() {
  const mount = document.getElementById(PRINT_HOST_ID);
  if (!mount) return () => {};
  preparePrintHostForCapture(mount);
  void mount.offsetHeight;
  const shell = mount.querySelector(`#${PRINT_SHELL_ID}`);
  if (shell) void shell.offsetHeight;
  return () => {
    destroyBodyPrintMount();
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
  destroyBodyPrintMount();
}

export {
  PRINT_HOST_ID as MOUNT_ID,
  PRINT_HOST_ID,
  HANDBOOK_PRINT_AREA_ID,
  HANDBOOK_PRINT_SLOT_ID,
  PREVIEW_MOUNT_ID,
  PREVIEW_SHELL_ID,
  PRINT_SHELL_ID,
  fiscalPrintDialogClass,
};
