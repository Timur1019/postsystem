// src/components/cashier/CashierShiftModal.jsx
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { X, FileText, Printer, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { cashierShiftApi } from '../../services/api';
import PosModalPortal from './PosModalPortal';
import { fmtMoney as fmt } from '../../utils/formatMoney';

function ReportBlock({ report, t }) {
  if (!report) return null;
  return (
    <div className="cashier-shift-report">
      <p className="cashier-shift-report__type">
        {report.reportType === 'X' ? t('pos.xReport') : t('pos.zReport')}
      </p>
      <dl className="cashier-shift-report__grid">
        <dt>{t('pos.shiftSales')}</dt>
        <dd>{report.saleCount}</dd>
        <dt>{t('pos.shiftTotal')}</dt>
        <dd>{fmt(report.totalAmount)} сум</dd>
        <dt>{t('pos.shiftCash')}</dt>
        <dd>{fmt(report.cashAmount)} сум</dd>
        <dt>{t('pos.shiftCard')}</dt>
        <dd>{fmt(report.cardAmount)} сум</dd>
        <dt>{t('pos.shiftVat')}</dt>
        <dd>{fmt(report.vatAmount)} сум</dd>
      </dl>
    </div>
  );
}

export default function CashierShiftModal({ open, onClose, storeId, shift, onShiftUpdated }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const shiftId = shift?.id;
  const [xReport, setXReport] = useState(null);
  const [zReport, setZReport] = useState(null);

  const xMutation = useMutation({
    mutationFn: () => cashierShiftApi.xReport(shiftId).then((r) => r.data),
    onSuccess: (data) => {
      setXReport(data);
      toast.success(t('pos.xReportLoaded'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('pos.reportFailed')),
  });

  const zMutation = useMutation({
    mutationFn: () => cashierShiftApi.zReport(shiftId).then((r) => r.data),
    onSuccess: (data) => {
      setZReport(data);
      toast.success(t('pos.zReportLoaded'));
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('pos.reportFailed')),
  });

  const closeMutation = useMutation({
    mutationFn: () => cashierShiftApi.close(shiftId).then((r) => r.data),
    onSuccess: (closedShift) => {
      toast.success(t('pos.shiftClosed'));
      qc.invalidateQueries({ queryKey: ['cashier-shift', storeId] });
      onShiftUpdated?.(closedShift);
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('pos.shiftCloseFailed')),
  });

  useEffect(() => {
    if (!open) {
      setXReport(null);
      setZReport(null);
    }
  }, [open]);

  const isOpen = shift?.status === 'OPEN';
  const busy = xMutation.isPending || zMutation.isPending || closeMutation.isPending;

  if (!shift) return null;

  return (
    <PosModalPortal open={open} onClose={onClose}>
      <div className="pos-pay-modal pos-pay-modal--shift" onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" className="pos-pay-modal__close" onClick={onClose} aria-label={t('common.close')}>
          <X size={20} />
        </button>
        <h2 className="pos-pay-modal__title">{t('pos.shiftTitle')}</h2>
        <p className="cashier-shift-modal__meta">
          {shift.storeName} · {shift.cashierName}
        </p>
        <p className="cashier-shift-modal__status">
          {t('pos.shiftStatus')}:{' '}
          <span className={isOpen ? 'is-open' : ''}>
            {isOpen ? t('pos.shiftOpen') : t('pos.shiftClosedLabel')}
          </span>
        </p>

        <div className="cashier-shift-modal__actions">
          <button
            type="button"
            className="pos-shift-action"
            disabled={!isOpen || busy}
            onClick={() => xMutation.mutate()}
          >
            {xMutation.isPending ? <Loader size={16} className="animate-spin" /> : <FileText size={16} />}
            {t('pos.viewXReport')}
          </button>
          <button
            type="button"
            className="pos-shift-action"
            disabled={busy}
            onClick={() => zMutation.mutate()}
          >
            {zMutation.isPending ? <Loader size={16} className="animate-spin" /> : <Printer size={16} />}
            {t('pos.viewZReport')}
          </button>
          {isOpen && (
            <button
              type="button"
              className="pos-shift-action pos-shift-action--danger"
              disabled={busy}
              onClick={() => closeMutation.mutate()}
            >
              {closeMutation.isPending ? <Loader size={16} className="animate-spin" /> : null}
              {t('pos.closeShift')}
            </button>
          )}
        </div>

        <ReportBlock report={xReport} t={t} />
        <ReportBlock report={zReport} t={t} />
      </div>
    </PosModalPortal>
  );
}
