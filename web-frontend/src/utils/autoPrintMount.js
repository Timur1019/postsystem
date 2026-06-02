/**
 * DOM-контейнер автопечати чека.
 *
 * Превью (React) → #pos-auto-print-mount / #fiscal-print-shell-live (в слоте)
 * Печать (Electron) → #pos-auto-print-print-host / #fiscal-print-shell (на body, копия HTML)
 */
import { RECEIPT_AUTO_PRINT_UI, RECEIPT_PRINT_DOM, RECEIPT_PRINT_STYLES } from '../config/receiptPrintConfig';

const {
  autoPrintMountId: MOUNT_ID,
  autoPrintSlotId: SLOT_ID,
  previewShellId: PREVIEW_SHELL_ID,
  fiscalPrintShellId: PRINT_SHELL_ID,
  bodyPrintHostId: BODY_PRINT_HOST_ID,
  fiscalPrintDialogClass,
} = RECEIPT_PRINT_DOM;

let pendingUnmountTimer = null;

function mountInto(hostEl, mode) {
  hostEl.classList.remove(
    'fiscal-print-scene--offscreen',
    'pos-auto-print-host--in-pay',
    'pos-auto-print-host--in-actions',
    'pos-auto-print-host--in-slot',
  );
  hostEl.classList.add(
    RECEIPT_PRINT_DOM.autoPrintHostClass,
    RECEIPT_PRINT_STYLES.hostEmbeddedClass,
    `pos-auto-print-host--${mode}`,
  );
  hostEl.style.position = '';
  hostEl.style.left = '';
  hostEl.style.right = '';
  hostEl.style.top = '';
  hostEl.style.opacity = '';
  hostEl.style.zIndex = '';
  const parent =
    document.getElementById(SLOT_ID) ||
    document.querySelector('.cashier-register__actions-col--pay .pos-pay-panel__scroll') ||
    document.querySelector('.cashier-register__actions-col');
  if (!parent) {
    document.body.appendChild(hostEl);
    hostEl.classList.remove('pos-auto-print-host--embedded', `pos-auto-print-host--${mode}`);
    hostEl.classList.add('fiscal-print-scene--offscreen');
    return;
  }
  parent.appendChild(hostEl);
}

/** После закрытия оплаты слот снова в DOM — переносим mount в правую колонку. */
export function ensureAutoPrintMountInSlot() {
  const el = document.getElementById(MOUNT_ID);
  const slot = document.getElementById(SLOT_ID);
  if (el && slot && !slot.contains(el)) {
    mountInto(el, 'in-slot');
  }
}

export function getAutoPrintMountEl() {
  let el = document.getElementById(MOUNT_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = MOUNT_ID;
    el.className = `fiscal-print-scene pos-sale-print-host ${RECEIPT_PRINT_DOM.autoPrintHostClass}`;
    el.setAttribute('aria-hidden', 'true');

    const slot = document.getElementById(SLOT_ID);
    if (slot) {
      mountInto(el, 'in-slot');
    } else if (document.querySelector('.cashier-register__actions-col--pay .pos-pay-panel__scroll')) {
      mountInto(el, 'in-pay');
    } else if (document.querySelector('.cashier-register__actions-col')) {
      mountInto(el, 'in-actions');
    } else {
      el.classList.add('fiscal-print-scene--offscreen');
      document.body.appendChild(el);
    }
  } else {
    const slot = document.getElementById(SLOT_ID);
    if (slot && !slot.contains(el)) {
      mountInto(el, 'in-slot');
    }
  }
  return el;
}

export function findLivePreviewShell() {
  const bodyHost = document.getElementById(BODY_PRINT_HOST_ID);
  const mount = document.getElementById(MOUNT_ID);

  const candidates = [
    document.getElementById(PREVIEW_SHELL_ID),
    mount?.querySelector(`#${PREVIEW_SHELL_ID}`),
    mount?.querySelector(`#${PRINT_SHELL_ID}`),
  ].filter(Boolean);

  for (const el of candidates) {
    if (bodyHost?.contains(el)) continue;
    return el;
  }

  const legacy = document.getElementById(PRINT_SHELL_ID);
  if (legacy && !bodyHost?.contains(legacy) && mount?.contains(legacy)) {
    return legacy;
  }
  return null;
}

export function removeBodyPrintHost() {
  document.getElementById(BODY_PRINT_HOST_ID)?.remove();
}

/**
 * Копия HTML превью на body. На body ровно один #fiscal-print-shell — Electron и @media print.
 * React-превью в слоте не трогаем (id fiscal-print-shell-live).
 */
export function mountBodyPrintShellFromPreview() {
  const liveShell = findLivePreviewShell();
  if (!liveShell) {
    return () => {};
  }

  if (liveShell.id === PRINT_SHELL_ID && document.getElementById(MOUNT_ID)?.contains(liveShell)) {
    liveShell.id = PREVIEW_SHELL_ID;
  }

  removeBodyPrintHost();

  const host = document.createElement('div');
  host.id = BODY_PRINT_HOST_ID;
  host.className = `fiscal-print-scene pos-sale-print-host ${RECEIPT_PRINT_STYLES.hostBodyPrintClass}`;
  host.setAttribute('aria-hidden', 'true');

  const dialog = document.createElement('div');
  dialog.className = fiscalPrintDialogClass;

  const printShell = document.createElement('div');
  printShell.id = PRINT_SHELL_ID;
  printShell.innerHTML = liveShell.innerHTML;

  dialog.appendChild(printShell);
  host.appendChild(dialog);
  document.body.appendChild(host);

  return () => {
    removeBodyPrintHost();
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

export { MOUNT_ID, SLOT_ID, PREVIEW_SHELL_ID, PRINT_SHELL_ID, fiscalPrintDialogClass };
