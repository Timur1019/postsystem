/**
 * DOM автопечати: превью в слоте кассы + печать в «Справочник модулей».
 *
 * Превью (экран кассы) → #pos-auto-print-preview-mount / #fiscal-print-shell-live
 * Печать (Electron)    → #pos-auto-print-handbook-print-slot / #pos-auto-print-print-host / #fiscal-print-shell
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
    const shell = document.querySelector('.cashier-app') || document.body;
    shell.appendChild(area);
  } else {
    const shell = document.querySelector('.cashier-app') || document.body;
    if (area.parentElement !== shell) {
      shell.appendChild(area);
    }
    hideHandbookPrintOnPosScreen();
  }
  return area;
}

/** Контейнер печати: слот справочника (если открыт) или fallback в layout кассы. */
export function getHandbookPrintContainer() {
  const slot = document.getElementById(HANDBOOK_PRINT_SLOT_ID);
  if (slot) return slot;
  return ensureHandbookPrintArea();
}

/** Переносит print-host в слот справочника, когда страница открыта. */
export function reparentPrintHostToHandbookSlot() {
  const host = document.getElementById(PRINT_HOST_ID);
  const slot = document.getElementById(HANDBOOK_PRINT_SLOT_ID);
  if (!host || !slot || slot.contains(host)) return;
  slot.appendChild(host);
  host.removeAttribute('aria-hidden');
}

function ensureBodyPrintMount() {
  document.getElementById(LEGACY_PRINT_MOUNT_ID)?.remove();
  document.getElementById(LEGACY_SUPPORT_LANE_ID)?.remove();

  const container = getHandbookPrintContainer();

  let el = document.getElementById(PRINT_HOST_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = PRINT_HOST_ID;
    el.className = `pos-sale-print-host ${autoPrintHostClass} ${hostBodyPrintClass}`;
    el.setAttribute('aria-hidden', 'true');
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

export function getAutoPrintFiscalShell() {
  const printHost =
    document.getElementById(PRINT_HOST_ID) || document.getElementById(LEGACY_PRINT_MOUNT_ID);
  const shell = printHost?.querySelector(`#${PRINT_SHELL_ID}`);
  if (!shell) return null;
  const handbookRoot =
    document.getElementById(HANDBOOK_PRINT_SLOT_ID) ||
    document.getElementById(HANDBOOK_PRINT_AREA_ID);
  if (handbookRoot?.contains(shell)) {
    return shell;
  }
  if (!document.getElementById('root')?.contains(shell)) {
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
    finalizeHandbookPrintMount();
  };
}

/** После печати — оставляем чек в справочнике, на экране кассы скрываем. */
export function finalizeHandbookPrintMount() {
  const host = document.getElementById(PRINT_HOST_ID);
  if (!host) return;
  host.classList.remove(hostCapturingClass);
  clearHostInlineStyles(host);
  reparentPrintHostToHandbookSlot();
  if (document.getElementById(HANDBOOK_PRINT_SLOT_ID)?.contains(host)) {
    host.removeAttribute('aria-hidden');
  }
  hideHandbookPrintOnPosScreen();
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
  document.getElementById(LEGACY_SUPPORT_LANE_ID)?.remove();
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
    finalizeHandbookPrintMount();
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
  /* print-host остаётся в справочнике для просмотра */
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
