// src/components/z-reports/ZReportAutoPrint.jsx
import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { zReportApi } from '../../services/api';
import ThermalReportPrintPortal from '../reports/ThermalReportPrintPortal';
import ZReportReceiptBody from './ZReportReceiptBody';

export default function ZReportAutoPrint({ zReportId, onClose }) {
  const { t } = useTranslation();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const { data: z, isPending, isError, error } = useQuery({
    queryKey: ['z-report-print', zReportId],
    queryFn: () => zReportApi.getById(zReportId).then((r) => r.data),
    enabled: Boolean(zReportId),
  });

  useEffect(() => {
    if (!zReportId || !isPending) return undefined;
    const id = toast.loading(t('common.loading'));
    return () => toast.dismiss(id);
  }, [zReportId, isPending, t]);

  useEffect(() => {
    if (!isError) return;
    toast.error(error?.response?.data?.message ?? error?.message ?? t('zReports.loadError'));
    onCloseRef.current?.();
  }, [isError, error, t]);

  if (isError || isPending || !z) {
    return null;
  }

  return (
    <ThermalReportPrintPortal
      open
      printToken={zReportId}
      onClose={() => onCloseRef.current?.()}
      onPrinted={() => toast.success(t('receipt.printSent'))}
    >
      <ZReportReceiptBody z={z} />
    </ThermalReportPrintPortal>
  );
}
