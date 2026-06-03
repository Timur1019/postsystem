import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { enqueueReceipt, setAutoPrintTranslator } from '../services/autoPrint';

const PosAutoPrintContext = createContext(null);

export function PosAutoPrintProvider({ children }) {
  const { t } = useTranslation();

  useEffect(() => {
    setAutoPrintTranslator(t);
  }, [t]);

  const enqueue = useCallback((sale) => enqueueReceipt(sale), []);

  const value = useMemo(() => ({ enqueueReceipt: enqueue }), [enqueue]);

  return <PosAutoPrintContext.Provider value={value}>{children}</PosAutoPrintContext.Provider>;
}

export function usePosAutoPrint() {
  const ctx = useContext(PosAutoPrintContext);
  if (!ctx) {
    throw new Error('usePosAutoPrint must be used within PosAutoPrintProvider');
  }
  return ctx;
}
