/** Стабильный контейнер чека для автопечати (переживает React StrictMode remount). */
const MOUNT_ID = 'pos-auto-print-mount';
const SLOT_ID = 'pos-auto-print-slot';

let pendingUnmountTimer = null;

function mountInto(hostEl, mode) {
  hostEl.classList.remove('fiscal-print-scene--offscreen', 'pos-auto-print-host--in-pay', 'pos-auto-print-host--in-actions', 'pos-auto-print-host--in-slot');
  hostEl.classList.add('pos-auto-print-host--embedded', `pos-auto-print-host--${mode}`);
  hostEl.style.position = '';
  hostEl.style.left = '';
  hostEl.style.right = '';
  hostEl.style.top = '';
  hostEl.style.opacity = '';
  hostEl.style.zIndex = '';
  const parent = document.getElementById(SLOT_ID)
    || document.querySelector('.cashier-register__actions-col--pay .pos-pay-panel__scroll')
    || document.querySelector('.cashier-register__actions-col');
  if (!parent) {
    document.body.appendChild(hostEl);
    hostEl.classList.remove('pos-auto-print-host--embedded', `pos-auto-print-host--${mode}`);
    hostEl.classList.add('fiscal-print-scene--offscreen');
    return;
  }
  parent.appendChild(hostEl);
}

export function getAutoPrintMountEl() {
  let el = document.getElementById(MOUNT_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = MOUNT_ID;
    el.className = 'fiscal-print-scene pos-sale-print-host pos-auto-print-host';
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
    // Перемонтируем, если слот появился (например, после навигации).
    const slot = document.getElementById(SLOT_ID);
    if (slot && !slot.contains(el)) {
      mountInto(el, 'in-slot');
    }
  }
  return el;
}

export function cancelScheduledAutoPrintUnmount() {
  if (pendingUnmountTimer != null) {
    clearTimeout(pendingUnmountTimer);
    pendingUnmountTimer = null;
  }
}

export function scheduleAutoPrintUnmount(unmountFn, delayMs = 200) {
  cancelScheduledAutoPrintUnmount();
  pendingUnmountTimer = setTimeout(() => {
    pendingUnmountTimer = null;
    unmountFn();
  }, delayMs);
}

export function teardownAutoPrintMount() {
  cancelScheduledAutoPrintUnmount();
  const el = document.getElementById(MOUNT_ID);
  if (!el) return;
  try {
    el.replaceChildren();
  } catch {
    /* ignore */
  }
  // Убираем контейнер из слота — иначе #pos-auto-print-slot не :empty и белый блок остаётся до F5.
  el.remove();
}

/**
 * Перед silent print: копия чека на body для @media print (#root скрыт).
 * Превью в правом слоте не трогаем — на экране чек остаётся только справа.
 */
export function attachAutoPrintShellOnBodyForSilentCapture() {
  const source = document.getElementById(MOUNT_ID);
  const shell = source?.querySelector('#fiscal-print-shell');
  if (!shell) return () => {};

  let printHost = document.getElementById('pos-auto-print-print-host');
  if (!printHost) {
    printHost = document.createElement('div');
    printHost.id = 'pos-auto-print-print-host';
    printHost.className = 'fiscal-print-scene pos-sale-print-host fiscal-print-scene--offscreen';
    printHost.setAttribute('aria-hidden', 'true');
    document.body.appendChild(printHost);
  }

  printHost.replaceChildren();
  const dialog = document.createElement('div');
  dialog.className = 'fiscal-print-dialog';
  const shellClone = shell.cloneNode(true);
  shellClone.removeAttribute('id');
  shellClone.setAttribute('data-print-shell', 'true');
  dialog.appendChild(shellClone);
  printHost.appendChild(dialog);

  // Electron и assertAutoPrintShellReady ищут #fiscal-print-shell — временно на body.
  shell.id = 'fiscal-print-shell-live';
  shellClone.id = 'fiscal-print-shell';

  return () => {
    try {
      shell.id = 'fiscal-print-shell';
      printHost?.remove();
    } catch {
      /* ignore */
    }
  };
}
