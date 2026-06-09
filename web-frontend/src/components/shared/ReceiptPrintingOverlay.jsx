import { useTranslation } from 'react-i18next';
import { Loader2, Printer } from 'lucide-react';
import PosModalPortal from './PosModalPortal';
import '../../styles/shared/receipt-printing-overlay.css';

/**
 * Модалка процесса печати (без превью чека).
 */
export default function ReceiptPrintingOverlay({ open, title, hint }) {
  const { t } = useTranslation();
  const modalTitle = title ?? t('receipt.printingTitle', { defaultValue: 'Печатается чек…' });
  const modalHint =
    hint ?? t('receipt.printingHint', { defaultValue: 'Подождите, принтер получает данные' });

  return (
    <PosModalPortal
      open={open}
      onClose={() => {}}
      overlayClassName="receipt-printing-overlay"
    >
      <div
        className="receipt-printing-modal"
        role="status"
        aria-live="polite"
        aria-busy="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="receipt-printing-modal__icon" aria-hidden>
          <Printer size={26} strokeWidth={1.75} />
          <Loader2 size={34} className="receipt-printing-modal__spinner" />
        </div>
        <h3 className="receipt-printing-modal__title">{modalTitle}</h3>
        <p className="receipt-printing-modal__hint">{modalHint}</p>
      </div>
    </PosModalPortal>
  );
}
