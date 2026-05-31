/**
 * Модалка «Печатается…» на десктопе (чек / отчёт).
 */
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import '../../styles/desktop-print-overlay.css';

export default function DesktopPrintOverlay({
  open,
  messageKey = 'receipt.printing',
  message,
  children = null,
}) {
  const { t } = useTranslation();
  if (!open) return null;

  const label = message || t(messageKey, { defaultValue: 'Печатается чек…' });

  return (
    <div className="desktop-print-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="desktop-print-overlay__backdrop" aria-hidden />
      <div className="desktop-print-overlay__panel">
        <Loader2 className="desktop-print-overlay__spinner animate-spin" size={28} aria-hidden />
        <p className="desktop-print-overlay__text">{label}</p>
        {children ? <div className="desktop-print-overlay__preview">{children}</div> : null}
      </div>
    </div>
  );
}
