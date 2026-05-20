import { useEffect, useState } from 'react';

/** Компактная вёрстка кассы только ниже 800px; от 800px — десктопная раскладка. */
export const CASHIER_LAYOUT_MIN_WIDTH = 800;
export const CASHIER_COMPACT_MEDIA = '(max-width: 799px)';

export function useCashierCompactLayout() {
  const [compact, setCompact] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(CASHIER_COMPACT_MEDIA).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(CASHIER_COMPACT_MEDIA);
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return compact;
}
