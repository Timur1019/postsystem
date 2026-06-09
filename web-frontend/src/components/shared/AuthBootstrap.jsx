// Waits for persisted auth (localStorage) before rendering routes — avoids login redirect loops.
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';

export default function AuthBootstrap({ children }) {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return undefined;
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  useEffect(() => {
    if (hydrated) return undefined;
    const timer = setTimeout(() => setHydrated(true), 4000);
    return () => clearTimeout(timer);
  }, [hydrated]);

  if (!hydrated) {
    return null;
  }

  return children;
}
