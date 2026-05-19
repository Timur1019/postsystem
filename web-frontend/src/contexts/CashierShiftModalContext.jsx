import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CashierShiftModalContext = createContext(null);

export function CashierShiftModalProvider({ children }) {
  const [open, setOpen] = useState(false);

  const openShift = useCallback(() => setOpen(true), []);
  const closeShift = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, openShift, closeShift }),
    [open, openShift, closeShift]
  );

  return (
    <CashierShiftModalContext.Provider value={value}>{children}</CashierShiftModalContext.Provider>
  );
}

export function useCashierShiftModal() {
  const ctx = useContext(CashierShiftModalContext);
  if (!ctx) {
    throw new Error('useCashierShiftModal must be used within CashierShiftModalProvider');
  }
  return ctx;
}
