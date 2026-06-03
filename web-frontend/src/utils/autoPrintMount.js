/**
 * Один контейнер чека: #pos-auto-print-print-host на body.
 * На экране — компактно по центру; для принтера — класс --printing (полная ширина).
 */
import { RECEIPT_PRINT_DOM, RECEIPT_PRINT_STYLES } from '../config/receiptPrintConfig';

const {
  bodyPrintHostId: PRINT_HOST_ID,
  fiscalPrintShellId: PRINT_SHELL_ID,
  fiscalPrintDialogClass,
  autoPrintHostClass,
  staleDomIds,
} = RECEIPT_PRINT_DOM;

const { hostBodyPrintClass, hostOnScreenClass, hostPrintingClass, hostCapturingClass } =
  RECEIPT_PRINT_STYLES;

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

export function prepareMountForSilentCapture() {
  const host = document.getElementById(PRINT_HOST_ID);
  if (!host) return () => {};
  host.classList.add(hostCapturingClass, hostPrintingClass);
  const shell = host.querySelector(`#${PRINT_SHELL_ID}`);
  if (shell) {
    shell.style.background = '#ffffff';
    shell.style.color = '#000000';
    void shell.offsetHeight;
  }
  void host.offsetHeight;
  return () => {
    host.classList.remove(hostCapturingClass, hostPrintingClass);
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
    host.classList.remove(hostCapturingClass, hostPrintingClass, hostOnScreenClass);
    host.replaceChildren();
    host.remove();
  }
  removeStaleDom();
}

export function teardownAutoPrintDom({ force = false } = {}) {
  if (!force && autoPrintInFlight) return;
  destroyBodyPrintMount({ force: true });
}

export { PRINT_HOST_ID, PRINT_SHELL_ID, fiscalPrintDialogClass };
