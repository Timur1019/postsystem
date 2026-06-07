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
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-slate-100"
        role="status"
        aria-label="Loading"
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"
          aria-hidden
        />
      </div>
    );
  }

  return children;
}
