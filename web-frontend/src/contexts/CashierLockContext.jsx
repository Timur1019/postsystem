import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { clearCashierScreenLocked, isCashierScreenLocked, setCashierScreenLocked } from '../utils/cashierLock';

const CashierLockContext = createContext(null);

export function CashierLockProvider({ children }) {
  const userId = useAuthStore((s) => s.user?.id);
  const [locked, setLocked] = useState(() => isCashierScreenLocked(userId));

  useEffect(() => {
    setLocked(isCashierScreenLocked(userId));
  }, [userId]);

  const lock = useCallback(() => {
    setCashierScreenLocked(userId, true);
    setLocked(true);
  }, [userId]);

  const unlock = useCallback(() => {
    clearCashierScreenLocked(userId);
    setLocked(false);
  }, [userId]);

  const value = useMemo(() => ({ locked, lock, unlock }), [locked, lock, unlock]);

  return <CashierLockContext.Provider value={value}>{children}</CashierLockContext.Provider>;
}

export function useCashierLock() {
  const ctx = useContext(CashierLockContext);
  if (!ctx) {
    throw new Error('useCashierLock must be used within CashierLockProvider');
  }
  return ctx;
}
