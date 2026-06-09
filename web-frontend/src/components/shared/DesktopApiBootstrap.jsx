import { useEffect, useState } from 'react';
import { configureDesktopApiBaseUrl } from '../../services/desktopApiInit';
import { isDesktopCashier } from '../../utils/authLogin';

export default function DesktopApiBootstrap({ children }) {
  const [ready, setReady] = useState(!isDesktopCashier());

  useEffect(() => {
    if (!isDesktopCashier()) return undefined;
    let cancelled = false;
    configureDesktopApiBaseUrl().finally(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return null;
  }

  return children;
}
