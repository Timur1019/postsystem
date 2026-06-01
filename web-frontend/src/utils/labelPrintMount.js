/** Стабильный контейнер этикеток для тихой печати в Electron. */
const MOUNT_ID = 'pos-label-print-mount';

let pendingUnmountTimer = null;

export function getLabelPrintMountEl() {
  let el = document.getElementById(MOUNT_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = MOUNT_ID;
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  return el;
}

export function cancelScheduledLabelPrintUnmount() {
  if (pendingUnmountTimer != null) {
    clearTimeout(pendingUnmountTimer);
    pendingUnmountTimer = null;
  }
}

export function scheduleLabelPrintUnmount(unmountFn, delayMs = 220) {
  cancelScheduledLabelPrintUnmount();
  pendingUnmountTimer = setTimeout(() => {
    pendingUnmountTimer = null;
    unmountFn();
  }, delayMs);
}

export function teardownLabelPrintMount() {
  cancelScheduledLabelPrintUnmount();
  const el = document.getElementById(MOUNT_ID);
  if (el) {
    el.replaceChildren();
  }
}
