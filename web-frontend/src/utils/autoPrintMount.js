/** Стабильный контейнер чека для автопечати (переживает React StrictMode remount). */
const MOUNT_ID = 'pos-auto-print-mount';

let pendingUnmountTimer = null;

export function getAutoPrintMountEl() {
  let el = document.getElementById(MOUNT_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = MOUNT_ID;
    el.className = 'fiscal-print-scene fiscal-print-scene--offscreen pos-sale-print-host pos-auto-print-host';
    el.setAttribute('aria-hidden', 'true');
    // Если открыта касса — лучше монтировать внутрь правой панели оплаты,
    // чтобы превью чека было “внутри блока”, а не поверх всего UI.
    const payScroll =
      document.querySelector('.cashier-register__actions-col--pay .pos-pay-panel__scroll') ||
      document.querySelector('.cashier-register__actions-col--pay .pos-pay-panel__body');
    if (payScroll) {
      el.classList.add('pos-auto-print-host--in-pay');
      payScroll.prepend(el);
    } else {
      // Если панель оплаты не открыта — монтируем в правую колонку кассы.
      const actionsCol = document.querySelector('.cashier-register__actions-col');
      if (actionsCol) {
        el.classList.add('pos-auto-print-host--in-actions');
        actionsCol.prepend(el);
      } else {
        document.body.appendChild(el);
      }
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
  if (el) {
    el.replaceChildren();
  }
}
