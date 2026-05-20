import { useEffect, useState } from 'react';

/** Телефон, планшет до 1024px, низкий экран (например 450×200) */
export const CASHIER_COMPACT_MEDIA = '(max-width: 1023px), (max-height: 500px)';

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
