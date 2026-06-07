import { useCallback, useEffect, useRef, useState } from 'react';
import { Barcode, ChevronDown, Maximize, Printer, RefreshCw, LogOut, FileText, Tag, Download, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { CASHIER_ESCPOS_TOAST } from '../../config/cashierEscposConfig';
import {
  isCashierEscposPrintAvailable,
  printFiscalReceipt,
  resolveEscposPrintErrorMessage,
} from '../../services/cashierEscpos';
import { buildEscposTestSale } from '../../services/cashierEscpos/mockTestSale';

function isDesktopCashier() {
  return typeof window !== 'undefined' && Boolean(window.desktopCashier?.isDesktop);
}

export default function CashierDesktopMenu({ appName }) {
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

  if (!isDesktopCashier()) return null;

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

  const label = appName || 'Aurent';
  const printerLabel = printerName || t('desktop.receiptPrinterNotSet');
  const labelPrinterLabel = labelPrinterName || t('desktop.receiptPrinterNotSet');
  const scaleLabel = scalePort || t('desktop.scaleNotSet');

  return (
    <div
      ref={rootRef}
      className={`cashier-desktop-menu${open ? ' is-open' : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="cashier-desktop-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="cashier-desktop-menu__label">{label}</span>
        <ChevronDown size={16} strokeWidth={2.5} className="cashier-desktop-menu__chevron" aria-hidden />
      </button>
      <div className="cashier-desktop-menu__panel" role="menu">
        <button
          type="button"
          className="cashier-desktop-menu__item cashier-desktop-menu__item--stacked"
          role="menuitem"
          onClick={openPrinterPicker}
        >
          <Printer size={18} strokeWidth={2} aria-hidden />
          <span className="cashier-desktop-menu__item-text">
            <span>{t('desktop.receiptPrinter')}</span>
            <span className="cashier-desktop-menu__item-meta">
              {t('desktop.receiptPrinterHint', { name: printerLabel })}
            </span>
          </span>
        </button>
        <button
          type="button"
          className="cashier-desktop-menu__item"
          role="menuitem"
          onClick={runTestPrint}
        >
          <FileText size={18} strokeWidth={2} aria-hidden />
          <span>{t('desktop.testReceipt')}</span>
        </button>
        <div className="cashier-desktop-menu__sep" role="separator" />
        <button
          type="button"
          className="cashier-desktop-menu__item cashier-desktop-menu__item--stacked"
          role="menuitem"
          onClick={openLabelPicker}
        >
          <Tag size={18} strokeWidth={2} aria-hidden />
          <span className="cashier-desktop-menu__item-text">
            <span>{t('desktop.labelPrinter')}</span>
            <span className="cashier-desktop-menu__item-meta">
              {t('desktop.receiptPrinterHint', { name: labelPrinterLabel })}
            </span>
          </span>
        </button>
        <button
          type="button"
          className="cashier-desktop-menu__item"
          role="menuitem"
          onClick={openBarcodePage}
        >
          <Barcode size={18} strokeWidth={2} aria-hidden />
          <span>{t('desktop.barcodePrint')}</span>
        </button>
        <button
          type="button"
          className="cashier-desktop-menu__item cashier-desktop-menu__item--stacked"
          role="menuitem"
          onClick={openScalePicker}
        >
          <Scale size={18} strokeWidth={2} aria-hidden />
          <span className="cashier-desktop-menu__item-text">
            <span>{t('desktop.scale')}</span>
            <span className="cashier-desktop-menu__item-meta">
              {t('desktop.scaleHint', { port: scaleLabel })}
            </span>
          </span>
        </button>
        <div className="cashier-desktop-menu__sep" role="separator" />
        <button
          type="button"
          className="cashier-desktop-menu__item"
          role="menuitem"
          onClick={checkAppUpdates}
        >
          <Download size={18} strokeWidth={2} aria-hidden />
          <span>{t('desktop.checkUpdates')}</span>
        </button>
        <button
          type="button"
          className="cashier-desktop-menu__item"
          role="menuitem"
          onClick={() => run(() => window.desktopCashier.reload())}
        >
          <RefreshCw size={18} strokeWidth={2} aria-hidden />
          <span>{t('desktop.reload')}</span>
        </button>
        <button
          type="button"
          className="cashier-desktop-menu__item"
          role="menuitem"
          onClick={() => run(() => window.desktopCashier.toggleFullscreen())}
        >
          <Maximize size={18} strokeWidth={2} aria-hidden />
          <span>{t('desktop.fullscreen')}</span>
        </button>
        <div className="cashier-desktop-menu__sep" role="separator" />
        <button
          type="button"
          className="cashier-desktop-menu__item cashier-desktop-menu__item--danger"
          role="menuitem"
          onClick={() => run(() => window.desktopCashier.quit())}
        >
          <LogOut size={18} strokeWidth={2} aria-hidden />
          <span>{t('desktop.quit')}</span>
        </button>
      </div>
    </div>
  );
}
