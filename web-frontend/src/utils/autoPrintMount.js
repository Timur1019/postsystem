/**
 * DOM-контейнер автопечати чека.
 *
 * Превью + печать → #pos-auto-print-mount на body, #fiscal-print-shell (вне #root)
 */
import { RECEIPT_AUTO_PRINT_UI, RECEIPT_PRINT_DOM, RECEIPT_PRINT_STYLES } from '../config/receiptPrintConfig';

const {
  autoPrintMountId: MOUNT_ID,
  fiscalPrintShellId: PRINT_SHELL_ID,
  bodyPrintHostId: BODY_PRINT_HOST_ID,
  fiscalPrintDialogClass,
} = RECEIPT_PRINT_DOM;

const { hostCenteredClass } = RECEIPT_PRINT_STYLES;

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

/** Превью по центру экрана на body (вне #root) — Electron печатает тот же DOM. */
export function mountCenterPreview(hostEl) {
  hostEl.classList.remove(
    'fiscal-print-scene--offscreen',
    'pos-auto-print-host--embedded',
    'pos-auto-print-host--in-slot',
    'pos-auto-print-host--in-pay',
    'pos-auto-print-host--in-actions',
    'pos-auto-print-host--body-print',
  );
  hostEl.classList.add(RECEIPT_PRINT_DOM.autoPrintHostClass, hostCenteredClass);
  clearHostInlineStyles(hostEl);
  if (hostEl.parentElement !== document.body) {
    document.body.appendChild(hostEl);
  }
}

export function ensureAutoPrintMountCentered() {
  const el = document.getElementById(MOUNT_ID);
  if (el) mountCenterPreview(el);
}

export function getAutoPrintMountEl() {
  let el = document.getElementById(MOUNT_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = MOUNT_ID;
    el.className = `fiscal-print-scene pos-sale-print-host ${RECEIPT_PRINT_DOM.autoPrintHostClass}`;
    el.setAttribute('aria-live', 'polite');
    mountCenterPreview(el);
  } else {
    mountCenterPreview(el);
  }
  return el;
}

export function findLivePreviewShell() {
  const bodyHost = document.getElementById(BODY_PRINT_HOST_ID);
  const mount = document.getElementById(MOUNT_ID);

  const candidates = [
    mount?.querySelector(`#${PRINT_SHELL_ID}`),
    document.getElementById(PRINT_SHELL_ID),
  ].filter(Boolean);

  for (const el of candidates) {
    if (bodyHost?.contains(el)) continue;
    if (mount?.contains(el) || el.closest(`#${MOUNT_ID}`)) return el;
  }
  return null;
}

export function removeBodyPrintHost() {
  document.getElementById(BODY_PRINT_HOST_ID)?.remove();
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
  removeBodyPrintHost();
  const el = document.getElementById(MOUNT_ID);
  if (!el) return;
  try {
    el.replaceChildren();
  } catch {
    /* ignore */
  }
  el.remove();
}

export { MOUNT_ID, PRINT_SHELL_ID as PREVIEW_SHELL_ID, PRINT_SHELL_ID, fiscalPrintDialogClass };
