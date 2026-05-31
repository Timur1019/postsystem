// Автопечать после продажи: тихая печать Electron → POS-80; при сбое — диалог Windows.
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import ThermalReportPrintPortal from '../reports/ThermalReportPrintPortal';
import FiscalReceiptBody from '../receipt/FiscalReceiptBody';

export default function PosSaleAutoPrint({ sale, onDone }) {
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
        onDone?.();
      }}
      onClose={() => onDone?.()}
    >
      <FiscalReceiptBody sale={sale} />
    </ThermalReportPrintPortal>
  );
}
