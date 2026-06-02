import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import PosSaleAutoPrint from '../components/cashier/PosSaleAutoPrint';

const PosAutoPrintContext = createContext(null);

export function PosAutoPrintProvider({ children }) {
  const [autoPrintSale, setAutoPrintSale] = useState(null);

  const clearAutoPrintSale = useCallback(() => setAutoPrintSale(null), []);

  const value = useMemo(
    () => ({ autoPrintSale, setAutoPrintSale, clearAutoPrintSale }),
    [autoPrintSale, clearAutoPrintSale],
  );

  return (
    <PosAutoPrintContext.Provider value={value}>
      {children}
      {autoPrintSale ? (
        <PosSaleAutoPrint sale={autoPrintSale} onDone={clearAutoPrintSale} />
      ) : null}
    </PosAutoPrintContext.Provider>
  );
}

export function usePosAutoPrint() {
  const ctx = useContext(PosAutoPrintContext);
  if (!ctx) {
    throw new Error('usePosAutoPrint must be used within PosAutoPrintProvider');
  }
  return ctx;
}
