// Waits for persisted auth (localStorage) before rendering routes — avoids login redirect loops.
import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

export default function AuthBootstrap({ children }) {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const setHasHydrated = useAuthStore((s) => s.setHasHydrated);

  useEffect(() => {
    if (hasHydrated) return undefined;
    const timer = setTimeout(() => setHasHydrated(true), 4000);
    return () => clearTimeout(timer);
  }, [hasHydrated, setHasHydrated]);

  if (!hasHydrated) {
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
