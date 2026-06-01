/** Стабильный контейнер чека для автопечати (переживает React StrictMode remount). */
const MOUNT_ID = 'pos-auto-print-mount';

let pendingUnmountTimer = null;

export function getAutoPrintMountEl() {
  let el = document.getElementById(MOUNT_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = MOUNT_ID;
    el.className = 'fiscal-print-scene fiscal-print-scene--offscreen pos-sale-print-host';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
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
  if (el) {
    el.replaceChildren();
  }
}
