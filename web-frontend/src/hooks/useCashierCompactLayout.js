import { useEffect, useState } from 'react';

/** Только телефон: вкладки «Товары» / «Чек». От 700px — две колонки (касса, планшет). */
export const CASHIER_COMPACT_MEDIA = '(max-width: 699px)';

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
