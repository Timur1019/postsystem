import { useEffect, useState } from 'react';

/** Сенсор или «пальцевый» ввод (кассовый терминал, планшет). */
export const CASHIER_TOUCH_POINTER_MEDIA = '(pointer: coarse)';

/** Классический POS: 1024×768, 1280×800 и похожие. */
export const CASHIER_POS_DISPLAY_MEDIA =
  '(min-width: 1024px) and (max-width: 1600px) and (max-height: 900px)';

function readTouchLayout() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia(CASHIER_TOUCH_POINTER_MEDIA).matches
    || window.matchMedia(CASHIER_POS_DISPLAY_MEDIA).matches
  );
}

/**
 * true на сенсорных кассах и низких POS-мониторах — включает крупные кнопки (класс cashier-app--touch).
 */
export function useCashierTouchLayout() {
  const [touchLayout, setTouchLayout] = useState(readTouchLayout);

  useEffect(() => {
    const coarse = window.matchMedia(CASHIER_TOUCH_POINTER_MEDIA);
    const posDisplay = window.matchMedia(CASHIER_POS_DISPLAY_MEDIA);
    const sync = () => setTouchLayout(coarse.matches || posDisplay.matches);
    sync();
    coarse.addEventListener('change', sync);
    posDisplay.addEventListener('change', sync);
    return () => {
      coarse.removeEventListener('change', sync);
      posDisplay.removeEventListener('change', sync);
    };
  }, []);

  return touchLayout;
}
