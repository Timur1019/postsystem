import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { CASHIER_ESCPOS_TOAST } from '../../../config/cashierEscposConfig';
import {
  isCashierEscposPrintAvailable,
  printFiscalReceipt,
  resolveEscposPrintErrorMessage,
} from '../../../services/cashierEscpos';
import { buildEscposTestSale } from '../../../services/cashierEscpos/mockTestSale';
import { isDesktopCashier } from '../utils/isDesktopCashier';

export function useCashierDesktopMenu() {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [printerName, setPrinterName] = useState('');
  const [labelPrinterName, setLabelPrinterName] = useState('');
  const [scalePort, setScalePort] = useState('');

  const close = useCallback(() => setOpen(false), []);

  const refreshPrinter = useCallback(async () => {
    if (!isDesktopCashier() || typeof window.desktopCashier.getPrinterSettings !== 'function') {
      return;
    }
    try {
      const s = await window.desktopCashier.getPrinterSettings();
      setPrinterName(s?.receiptPrinterName || '');
      setLabelPrinterName(s?.labelPrinterName || '');
      if (typeof window.desktopCashier.scaleGetSettings === 'function') {
        const sc = await window.desktopCashier.scaleGetSettings();
        setScalePort(sc?.port || '');
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refreshPrinter();
  }, [refreshPrinter]);

  useEffect(() => {
    if (!open) return undefined;
    refreshPrinter();
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        close();
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close, refreshPrinter]);

  const run = async (fn) => {
    close();
    try {
      await fn?.();
    } catch {
      /* ignore */
    }
  };

  const openPrinterPicker = async () => {
    close();
    try {
      const settings = await window.desktopCashier.openPrinterPicker();
      const next = settings?.receiptPrinterName || '';
      setPrinterName(next);
      setLabelPrinterName(settings?.labelPrinterName || '');
      if (next) {
        toast.success(t('desktop.printerSaved'));
      }
    } catch {
      /* ignore */
    }
  };

  const openLabelPicker = async () => {
    close();
    if (typeof window.desktopCashier?.openLabelPrinterPicker !== 'function') return;
    try {
      const settings = await window.desktopCashier.openLabelPrinterPicker();
      const next = settings?.labelPrinterName || '';
      setLabelPrinterName(next);
      setPrinterName(settings?.receiptPrinterName || '');
      if (next) {
        toast.success(t('desktop.printerSaved'));
      }
    } catch {
      /* ignore */
    }
  };

  const runTestPrint = async () => {
    close();
    if (!isCashierEscposPrintAvailable()) {
      toast.error(t('desktop.testReceiptFailed'));
      return;
    }
    try {
      await printFiscalReceipt({ sale: buildEscposTestSale(), t });
      toast.success(t('desktop.testReceiptSent'), { id: CASHIER_ESCPOS_TOAST.toastId });
    } catch (e) {
      toast.error(resolveEscposPrintErrorMessage(e, t) ?? t('desktop.testReceiptFailed'), {
        id: CASHIER_ESCPOS_TOAST.toastId,
      });
    }
  };

  const openScalePicker = async () => {
    close();
    if (typeof window.desktopCashier?.openScalePicker !== 'function') return;
    try {
      const s = await window.desktopCashier.openScalePicker();
      setScalePort(s?.port || '');
      if (s?.port) {
        toast.success(t('desktop.scaleSaved'));
      }
    } catch {
      /* ignore */
    }
  };

  const openBarcodePage = () => {
    close();
    if (typeof window.desktopCashier?.openBarcodePage === 'function') {
      window.desktopCashier.openBarcodePage().catch(() => {
        /* ignore */
      });
    }
  };

  const checkAppUpdates = async () => {
    close();
    if (typeof window.desktopCashier?.checkForUpdates !== 'function') return;
    try {
      const result = await window.desktopCashier.checkForUpdates();
      if (result?.updateAvailable) {
        toast.success(t('desktop.checkUpdatesAvailable', { version: result.version }));
      } else if (result?.ok) {
        toast.success(t('desktop.checkUpdatesLatest'));
      } else if (result?.reason !== 'dev') {
        toast.error(t('desktop.checkUpdatesFailed'));
      }
    } catch {
      toast.error(t('desktop.checkUpdatesFailed'));
    }
  };

  if (!isDesktopCashier()) {
    return null;
  }

  return {
    t,
    rootRef,
    open,
    setOpen,
    close,
    run,
    printerName,
    labelPrinterName,
    scalePort,
    openPrinterPicker,
    openLabelPicker,
    runTestPrint,
    openScalePicker,
    openBarcodePage,
    checkAppUpdates,
    printerLabel: printerName || t('desktop.receiptPrinterNotSet'),
    labelPrinterLabel: labelPrinterName || t('desktop.receiptPrinterNotSet'),
    scaleLabel: scalePort || t('desktop.scaleNotSet'),
  };
}
