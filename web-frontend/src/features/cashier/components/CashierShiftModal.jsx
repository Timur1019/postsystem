// src/components/cashier/CashierShiftModal.jsx
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { X, FileText, Printer, Loader, DoorOpen, DoorClosed } from 'lucide-react';
import toast from 'react-hot-toast';
import { cashierShiftApi } from '../../../services/api';
import PosModalPortal from '../../../components/shared/PosModalPortal';
import ShiftReportPrintBody from './ShiftReportPrintBody';
import ThermalReportPrintPortal from '../../../components/shared/ThermalReportPrintPortal';
import { useAuthStore } from '../../../store/authStore';
import { useOpenCashierShift, useCloseCashierShift, shiftQueryKey } from '../../../hooks/useCashierShift';

export default function CashierShiftModal({
  open,
  onClose,
  storeId,
  storeName,
  cashierName,
  shift,
  onShiftUpdated,
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const shiftId = shift?.id;
  const [printReport, setPrintReport] = useState(null);
  const [printToken, setPrintToken] = useState(0);
  const printAfterLoadRef = useRef(null);

  const queuePrint = (data) => {
    setPrintToken((n) => n + 1);
    setPrintReport(data);
  };

  const xMutation = useMutation({
    mutationFn: () => cashierShiftApi.xReport(shiftId).then((r) => r.data),
    onSuccess: (data) => {
      if (printAfterLoadRef.current === 'X') {
        printAfterLoadRef.current = null;
        queuePrint(data);
      }
    },
    onError: (e) => {
      printAfterLoadRef.current = null;
      toast.error(e.response?.data?.message ?? t('pos.reportFailed'));
    },
  });

  const applyNewShift = (newShift) => {
    qc.setQueryData(shiftQueryKey(storeId, userId), newShift);
    qc.invalidateQueries({ queryKey: ['my-sales'] });
    onShiftUpdated?.(newShift);
  };

  const zMutation = useMutation({
    mutationFn: () => cashierShiftApi.finalizeZReport(shiftId).then((r) => r.data),
    onSuccess: (data) => {
      applyNewShift(data.newShift);
      qc.invalidateQueries({ queryKey: ['z-reports'] });
      toast.success(t('pos.zReportFinalized'));
      if (printAfterLoadRef.current === 'Z') {
        printAfterLoadRef.current = null;
        queuePrint(data.report);
      }
    },
    onError: (e) => {
      printAfterLoadRef.current = null;
      toast.error(e.response?.data?.message ?? t('pos.reportFailed'));
    },
  });

  const openMutation = useOpenCashierShift(storeId);

  const closeMutation = useCloseCashierShift(storeId);
  const handleCloseShift = () => {
    closeMutation.mutate(shiftId, {
      onSuccess: (closedShift) => {
        toast.success(t('pos.shiftClosedWithZReport'));
        onShiftUpdated?.(closedShift);
        onClose();
      },
      onError: (e) => toast.error(e.response?.data?.message ?? t('pos.shiftCloseFailed')),
    });
  };

  useEffect(() => {
    if (!open) {
      setPrintReport(null);
      printAfterLoadRef.current = null;
    }
  }, [open]);

  const isOpen = shift?.status === 'OPEN';
  const busy =
    xMutation.isPending ||
    zMutation.isPending ||
    closeMutation.isPending ||
    openMutation.isPending ||
    Boolean(printReport);

  const handleXReport = () => {
    printAfterLoadRef.current = 'X';
    xMutation.mutate();
  };

  const handleZReport = () => {
    printAfterLoadRef.current = 'Z';
    zMutation.mutate();
  };

  const metaStore = shift?.storeName ?? storeName ?? '—';
  const metaCashier = shift?.cashierName ?? cashierName ?? '—';

  return (
    <>
      <PosModalPortal open={open} onClose={onClose}>
        <div
          className="pos-pay-modal pos-pay-modal--shift pos-pay-modal--shift-terminal"
          onMouseDown={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cashier-shift-modal-title"
        >
          <header className="cashier-shift-modal__head">
            <h2 id="cashier-shift-modal-title" className="pos-pay-modal__title">
              {t('pos.shiftTitle')}
            </h2>
            <button type="button" className="pos-pay-modal__close" onClick={onClose} aria-label={t('common.close')}>
              <X size={20} />
            </button>
          </header>
          <p className="cashier-shift-modal__meta">
            {metaStore} · {metaCashier}
          </p>
          <p className="cashier-shift-modal__status">
            {t('pos.shiftStatus')}:{' '}
            <span className={isOpen ? 'is-open' : ''}>
              {isOpen ? t('pos.shiftOpen') : t('pos.shiftClosedLabel')}
            </span>
          </p>
          {isOpen ? (
            <p className="cashier-shift-modal__hint">{t('pos.shiftReportsHint')}</p>
          ) : null}

          <div className="cashier-shift-modal__actions">
            {isOpen ? (
              <>
                <button
                  type="button"
                  className="pos-shift-action"
                  disabled={busy}
                  onClick={handleXReport}
                >
                  {xMutation.isPending ? <Loader size={16} className="animate-spin" /> : <FileText size={16} />}
                  {t('pos.printXReport')}
                </button>
                <button
                  type="button"
                  className="pos-shift-action"
                  disabled={busy}
                  onClick={handleZReport}
                >
                  {zMutation.isPending ? <Loader size={16} className="animate-spin" /> : <Printer size={16} />}
                  {t('pos.printZReport')}
                </button>
                <button
                  type="button"
                  className="pos-shift-action pos-shift-action--danger"
                  disabled={busy}
                  onClick={handleCloseShift}
                >
                  {closeMutation.isPending ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <DoorClosed size={16} aria-hidden />
                  )}
                  {t('pos.closeShift')}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="pos-shift-action pos-shift-action--primary"
                disabled={!storeId || busy}
                onClick={() =>
                  openMutation.mutate(undefined, {
                    onSuccess: (openedShift) => {
                      toast.success(t('pos.shiftOpenedSuccess'));
                      onShiftUpdated?.(openedShift);
                    },
                    onError: (e) => toast.error(e.response?.data?.message ?? t('pos.shiftOpenFailed')),
                  })
                }
              >
                {openMutation.isPending ? <Loader size={16} className="animate-spin" /> : <DoorOpen size={16} />}
                {t('pos.openShift')}
              </button>
            )}
          </div>
        </div>
      </PosModalPortal>

      <ThermalReportPrintPortal
        open={Boolean(printReport)}
        printToken={printReport ? printToken : null}
        shiftReport={printReport}
        onClose={() => setPrintReport(null)}
        onPrinted={() => toast.success(t('receipt.printSent'))}
        onError={() => toast.error(t('receipt.printFailed'))}
      >
        {printReport ? <ShiftReportPrintBody report={printReport} /> : null}
      </ThermalReportPrintPortal>
    </>
  );
}
