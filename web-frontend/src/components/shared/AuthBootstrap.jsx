// Waits for persisted auth (localStorage) before rendering routes — avoids login redirect loops.
import { useAuthStore } from '../../store/authStore';

export default function AuthBootstrap({ children }) {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

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
