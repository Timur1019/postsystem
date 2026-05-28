// Автопечать чека после продажи в главном окне Electron (без скрытого окна).
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import ThermalReportPrintPortal from '../reports/ThermalReportPrintPortal';
import FiscalReceiptBody from '../receipt/FiscalReceiptBody';

export default function PosSaleAutoPrint({ sale, onDone, onFallback }) {
  const { t } = useTranslation();

  if (!sale) return null;

  return (
    <ThermalReportPrintPortal
      open
      printToken={sale.receiptNumber}
      onPrinted={() => {
        toast.success(t('pos.saleSuccess'));
        onDone?.();
      }}
      onError={() => {
        toast.error(t('pos.printFailed'));
        onFallback?.(sale);
      }}
      onClose={() => onDone?.()}
    >
      <FiscalReceiptBody sale={sale} />
    </ThermalReportPrintPortal>
  );
}
