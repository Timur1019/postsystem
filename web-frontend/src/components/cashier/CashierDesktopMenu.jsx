import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Maximize, RefreshCw, Server, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function isDesktopCashier() {
  return typeof window !== 'undefined' && Boolean(window.desktopCashier?.isDesktop);
}

export default function CashierDesktopMenu({ appName }) {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
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
  }, [open, close]);

  useEffect(() => {
    if (!isDesktopCashier()) return undefined;
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        window.desktopCashier?.openServerSetup?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!isDesktopCashier()) return null;

  const run = async (fn) => {
    close();
    try {
      await fn?.();
    } catch {
      /* ignore */
    }
  };

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
          className="cashier-desktop-menu__item"
          role="menuitem"
          onClick={() => run(() => window.desktopCashier.openServerSetup())}
        >
          <Server size={18} strokeWidth={2} aria-hidden />
          <span>{t('desktop.serverSetup')}</span>
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
