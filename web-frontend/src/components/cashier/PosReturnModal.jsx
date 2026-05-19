// src/components/cashier/PosReturnModal.jsx
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { X, Loader, Search } from 'lucide-react';
import { saleApi } from '../../services/api';
import PosModalPortal from './PosModalPortal';
import { fmtMoney as fmt } from '../../utils/formatMoney';

function normalizeReceiptCode(raw) {
  return String(raw ?? '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase();
}

function parseLookupError(err, t) {
  const status = err?.response?.status;
  const msg = err?.response?.data?.message ?? '';
  if (status === 403 || /access denied|доступ/i.test(msg)) {
    return t('pos.returnAccessDenied');
  }
  if (status === 404 || /not found|не найден/i.test(msg)) {
    return t('pos.returnNotFound');
  }
  return msg || t('pos.returnNotFound');
}

export default function PosReturnModal({ open, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [receipt, setReceipt] = useState('');
  const [reason, setReason] = useState('');
  const [sale, setSale] = useState(null);
  const [lookupPending, setLookupPending] = useState(false);

  const reset = () => {
    setReceipt('');
    setReason('');
    setSale(null);
    setLookupPending(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const lookup = async () => {
    const code = normalizeReceiptCode(receipt);
    if (!code) {
      toast.error(t('pos.returnReceiptPh'));
      return;
    }
    if (code !== receipt) setReceipt(code);

    setLookupPending(true);
    setSale(null);
    try {
      const res = await saleApi.getReceipt(code);
      if (res.data.status === 'VOIDED') {
        toast.error(t('pos.returnAlreadyVoided'));
        return;
      }
      setSale(res.data);
      toast.success(t('pos.returnFound', { receipt: res.data.receiptNumber }));
    } catch (e) {
      toast.error(parseLookupError(e, t));
    } finally {
      setLookupPending(false);
    }
  };

  const voidMutation = useMutation({
    mutationFn: () => saleApi.voidSale(sale.id, reason.trim() || t('pos.returnDefaultReason')),
    onSuccess: () => {
      toast.success(t('pos.returnSuccess'));
      reset();
      onClose();
      onSuccess?.();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('pos.returnFailed')),
  });

  return (
    <PosModalPortal open={open} onClose={handleClose}>
      <div className="pos-return-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" className="pos-pay-modal__close" onClick={handleClose} aria-label={t('common.close')}>
          <X size={20} />
        </button>
        <h2 className="pos-pay-modal__title">{t('pos.returnTitle')}</h2>
        <p className="pos-return-modal__hint">{t('pos.returnHint')}</p>

        <label className="pos-return-modal__label">{t('pos.returnReceipt')}</label>
        <div className="pos-return-modal__search">
          <input
            value={receipt}
            onChange={(e) => setReceipt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && lookup()}
            placeholder={t('pos.returnReceiptPh')}
            className="pos-return-modal__input"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="button"
            className="pos-return-modal__find"
            onClick={lookup}
            disabled={lookupPending || !receipt.trim()}
          >
            {lookupPending ? <Loader size={16} className="animate-spin" /> : <Search size={16} />}
            {t('pos.returnFind')}
          </button>
        </div>

        {sale && (
          <div className="pos-return-modal__preview">
            <div className="pos-return-modal__preview-head">
              <span className="pos-return-modal__preview-badge">{t('pos.returnFoundLabel')}</span>
              <span className="font-mono text-xs text-slate-500">{sale.receiptNumber}</span>
            </div>
            <p className="pos-return-modal__preview-total">{fmt(sale.totalAmount)} сум</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {sale.cashierName ?? '—'} · {sale.paymentMethod}
            </p>
            <ul className="pos-return-modal__lines">
              {(sale.items ?? []).length === 0 ? (
                <li className="text-slate-400">{t('pos.cartEmpty')}</li>
              ) : (
                (sale.items ?? []).map((line) => (
                  <li key={line.id ?? `${line.productName}-${line.quantity}`}>
                    <span>{line.productName}</span>
                    <span>
                      × {line.quantity} — {fmt(line.lineTotal)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        <label className="pos-return-modal__label">{t('pos.returnReason')}</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className="pos-return-modal__textarea"
          placeholder={t('pos.returnReasonPh')}
        />

        <button
          type="button"
          className="pos-pay-submit"
          disabled={!sale || voidMutation.isPending}
          onClick={() => voidMutation.mutate()}
        >
          {voidMutation.isPending ? <Loader size={18} className="animate-spin" /> : null}
          {t('pos.returnConfirm')}
        </button>
      </div>
    </PosModalPortal>
  );
}
