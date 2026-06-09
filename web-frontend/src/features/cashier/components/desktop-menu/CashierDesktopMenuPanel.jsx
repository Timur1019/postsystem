import {
  Barcode,
  ChevronDown,
  Download,
  FileText,
  LogOut,
  Maximize,
  Printer,
  RefreshCw,
  Scale,
  Tag,
} from 'lucide-react';

export default function CashierDesktopMenuPanel({
  appName,
  menu,
}) {
  const {
    t,
    rootRef,
    open,
    setOpen,
    run,
    printerLabel,
    labelPrinterLabel,
    scaleLabel,
    openPrinterPicker,
    openLabelPicker,
    runTestPrint,
    openScalePicker,
    openBarcodePage,
    checkAppUpdates,
  } = menu;

  const label = appName || 'Aurent';

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
