// Автопечать после продажи: тот же путь, что «Печать чека» в браузере (window.print + POS-80).
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import ThermalReportPrintPortal from '../reports/ThermalReportPrintPortal';
import FiscalReceiptBody from '../receipt/FiscalReceiptBody';

export default function PosSaleAutoPrint({ sale, onDone }) {
  const { t } = useTranslation();

  useEffect(() => {
    toast(t('pos.printDialogAuto'), { id: 'pos-auto-print-hint', duration: 6000 });
  }, [t]);

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
