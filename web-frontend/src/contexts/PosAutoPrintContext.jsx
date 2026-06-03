import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import {
  enqueueReceipt,
  getPreviewReceiptNumber,
  setAutoPrintTranslator,
  subscribePreview,
} from '../services/autoPrint';

const PosAutoPrintContext = createContext(null);

export function PosAutoPrintProvider({ children }) {
  const { t } = useTranslation();

  useEffect(() => {
    setAutoPrintTranslator(t);
  }, [t]);

  const previewReceiptNumber = useSyncExternalStore(
    subscribePreview,
    getPreviewReceiptNumber,
    () => null,
  );

  const enqueue = useCallback((sale) => enqueueReceipt(sale), []);

  const value = useMemo(() => ({ enqueueReceipt: enqueue, previewReceiptNumber }), [enqueue, previewReceiptNumber]);

  return <PosAutoPrintContext.Provider value={value}>{children}</PosAutoPrintContext.Provider>;
}

export function usePosAutoPrint() {
  const ctx = useContext(PosAutoPrintContext);
  if (!ctx) {
    throw new Error('usePosAutoPrint must be used within PosAutoPrintProvider');
  }
  return ctx;
}

/** @deprecated use enqueueReceipt */
export function usePosAutoPrintLegacy() {
  const { enqueueReceipt: enqueue } = usePosAutoPrint();
  return {
    setAutoPrintSale: enqueue,
    autoPrintSale: null,
    clearAutoPrintSale: () => {},
  };
}
