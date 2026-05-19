// src/components/cashier/PosReturnModal.jsx
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { X, Loader, Search, RotateCcw, Receipt, CheckCircle2 } from 'lucide-react';
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

function paymentLabel(method, t) {
  switch (method) {
    case 'CASH':
      return t('pos.payCash');
    case 'CARD':
      return t('pos.payCard');
    case 'MIXED':
      return t('pos.payMixed');
    case 'MPESA':
      return 'M-Pesa';
    default:
      return method || '—';
  }
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
      <div className="pos-return-modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="pos-return-modal__header">
          <div className="pos-return-modal__header-icon" aria-hidden>
            <RotateCcw size={22} strokeWidth={2} />
          </div>
          <div className="pos-return-modal__header-text">
            <h2 className="pos-return-modal__title">{t('pos.returnTitle')}</h2>
            <p className="pos-return-modal__hint">{t('pos.returnHint')}</p>
          </div>
          <button
            type="button"
            className="pos-return-modal__close"
            onClick={handleClose}
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>
        </header>

        <div className="pos-return-modal__body">
          <section className="pos-return-modal__section">
            <label className="pos-return-modal__label" htmlFor="pos-return-receipt">
              {t('pos.returnReceipt')}
            </label>
            <div className="pos-return-modal__search">
              <div className="pos-return-modal__input-wrap">
                <Receipt size={18} className="pos-return-modal__input-icon" aria-hidden />
                <input
                  id="pos-return-receipt"
                  value={receipt}
                  onChange={(e) => setReceipt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && lookup()}
                  placeholder={t('pos.returnReceiptPh')}
                  className="pos-return-modal__input"
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                className="pos-return-modal__find"
                onClick={lookup}
                disabled={lookupPending || !receipt.trim()}
              >
                {lookupPending ? (
                  <Loader size={18} className="pos-return-modal__spin" />
                ) : (
                  <Search size={18} />
                )}
                <span>{t('pos.returnFind')}</span>
              </button>
            </div>
          </section>

          {sale ? (
            <section className="pos-return-modal__preview" aria-live="polite">
              <div className="pos-return-modal__preview-head">
                <span className="pos-return-modal__preview-badge">
                  <CheckCircle2 size={14} aria-hidden />
                  {t('pos.returnFoundLabel')}
                </span>
                <span className="pos-return-modal__preview-receipt">{sale.receiptNumber}</span>
              </div>
              <p className="pos-return-modal__preview-total">
                {fmt(sale.totalAmount)}
                <span className="pos-return-modal__preview-currency">сум</span>
              </p>
              <div className="pos-return-modal__preview-meta">
                <span>{sale.cashierName ?? '—'}</span>
                <span className="pos-return-modal__preview-dot" aria-hidden>
                  ·
                </span>
                <span>{paymentLabel(sale.paymentMethod, t)}</span>
              </div>
              <ul className="pos-return-modal__lines">
                {(sale.items ?? []).length === 0 ? (
                  <li className="pos-return-modal__lines-empty">{t('pos.cartEmpty')}</li>
                ) : (
                  (sale.items ?? []).map((line) => (
                    <li key={line.id ?? `${line.productName}-${line.quantity}`}>
                      <span className="pos-return-modal__line-name">{line.productName}</span>
                      <span className="pos-return-modal__line-qty">
                        ×{line.quantity}
                      </span>
                      <span className="pos-return-modal__line-sum">{fmt(line.lineTotal)}</span>
                    </li>
                  ))
                )}
              </ul>
            </section>
          ) : (
            <div className="pos-return-modal__placeholder">
              <Receipt size={28} strokeWidth={1.5} aria-hidden />
              <p>{t('pos.returnSearchPrompt')}</p>
            </div>
          )}

          <section className="pos-return-modal__section">
            <label className="pos-return-modal__label" htmlFor="pos-return-reason">
              {t('pos.returnReason')}
            </label>
            <textarea
              id="pos-return-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="pos-return-modal__textarea"
              placeholder={t('pos.returnReasonPh')}
            />
          </section>
        </div>

        <footer className="pos-return-modal__footer">
          <button type="button" className="pos-return-modal__cancel" onClick={handleClose}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="pos-return-modal__submit"
            disabled={!sale || voidMutation.isPending}
            onClick={() => voidMutation.mutate()}
          >
            {voidMutation.isPending ? (
              <Loader size={18} className="pos-return-modal__spin" />
            ) : (
              <RotateCcw size={18} />
            )}
            <span>{t('pos.returnConfirm')}</span>
          </button>
        </footer>
      </div>
    </PosModalPortal>
  );
}
