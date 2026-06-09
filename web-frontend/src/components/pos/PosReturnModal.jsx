// src/components/cashier/PosReturnModal.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { X, Loader, RotateCcw, Receipt, CheckCircle2, Hash } from 'lucide-react';
import { saleApi } from '../../api/sale.api';
import { printReturnReceiptWithToast } from '../../utils/printReturnReceipt';
import { isReadyReceiptLookup, parseReceiptLookupInput } from '../../utils/receiptLookup';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import PosModalPortal from '../shared/PosModalPortal';
import { fmtMoney as fmt } from '../../utils/formatMoney';
import SaleReturnLinesEditor, {
  buildReturnPayload,
  getReturnableLines,
  useReturnQtyState,
} from '../sale-return/SaleReturnLinesEditor';

const RECEIPT_LOOKUP_DEBOUNCE_MS = 450;

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
    case 'CASHLESS':
      return t('pos.payCashless');
    case 'MIXED':
      return t('pos.payMixed');
    case 'MPESA':
      return 'M-Pesa';
    default:
      return method || '—';
  }
}

export default function PosReturnModal({ open, onClose, onSuccess, terminal = false }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [receiptQuery, setReceiptQuery] = useState('');
  const [reason, setReason] = useState('');
  const [sale, setSale] = useState(null);
  const [lookupPending, setLookupPending] = useState(false);
  const lastLookupRef = useRef('');
  const saleRef = useRef(null);
  const debouncedQuery = useDebouncedValue(receiptQuery, RECEIPT_LOOKUP_DEBOUNCE_MS);
  saleRef.current = sale;
  const { qtyByItemId, setQty, selectAllMax, totalSelected } = useReturnQtyState(sale, open && !!sale);

  const reset = () => {
    setReceiptQuery('');
    setReason('');
    setSale(null);
    setLookupPending(false);
    lastLookupRef.current = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const lookupReceipt = useCallback(
    async (query) => {
      const code = String(query ?? '').trim();
      if (!code) {
        setSale(null);
        return;
      }
      if (lastLookupRef.current === code && saleRef.current) {
        return;
      }

      setLookupPending(true);
      setSale(null);
      lastLookupRef.current = code;

      try {
        const res = await saleApi.getReceipt(code);
        if (res.data.status === 'VOIDED') {
          toast.error(t('pos.returnAlreadyVoided'));
          return;
        }
        if (getReturnableLines(res.data).length === 0) {
          toast.error(t('pos.returnNoItems'));
          return;
        }
        setSale(res.data);
        toast.success(t('pos.returnFound', { receipt: res.data.receiptNumber }));
      } catch (e) {
        if (lastLookupRef.current === code) {
          setSale(null);
        }
        toast.error(parseLookupError(e, t));
      } finally {
        setLookupPending(false);
      }
    },
    [t]
  );

  useEffect(() => {
    if (!open) return;
    if (!debouncedQuery || !isReadyReceiptLookup(debouncedQuery)) {
      if (!debouncedQuery) {
        setSale(null);
        lastLookupRef.current = '';
      }
      return;
    }
    lookupReceipt(debouncedQuery);
  }, [debouncedQuery, open, lookupReceipt]);

  const returnMutation = useMutation({
    mutationFn: () => {
      const payload = buildReturnPayload(
        sale,
        qtyByItemId,
        reason.trim() || t('pos.returnDefaultReason')
      );
      if (!payload.lines.length) {
        return Promise.reject(new Error(t('pos.returnSelectQty')));
      }
      return saleApi.returnItems(sale.id, payload).then((r) => r.data);
    },
    onSuccess: async () => {
      const returnReason = reason.trim() || t('pos.returnDefaultReason');
      toast.success(t('pos.returnSuccess'));
      qc.invalidateQueries({ queryKey: ['my-sales'] });
      qc.invalidateQueries({ queryKey: ['sales-ledger'] });
      qc.invalidateQueries({ queryKey: ['returns'] });
      qc.invalidateQueries({ queryKey: ['cashier-shift'] });

      if (sale) {
        await printReturnReceiptWithToast({
          originalSale: sale,
          qtyByItemId,
          reason: returnReason,
          t,
        });
      }

      reset();
      onClose();
      onSuccess?.();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? e?.message ?? t('pos.returnFailed')),
  });

  const handleReceiptChange = (e) => {
    setReceiptQuery(parseReceiptLookupInput(e.target.value));
  };

  return (
    <PosModalPortal open={open} onClose={handleClose}>
      <div
        className={`pos-return-modal${terminal ? ' pos-return-modal--terminal' : ''}${
          sale ? ' pos-return-modal--partial' : ''
        }`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
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
            <div className="pos-return-modal__receipt-field">
              <span className="pos-return-modal__receipt-prefix" aria-hidden>
                {t('pos.returnReceiptPrefix')}
              </span>
              <div className="pos-return-modal__input-wrap pos-return-modal__input-wrap--digits">
                <Hash size={18} className="pos-return-modal__input-icon" aria-hidden />
                <input
                  id="pos-return-receipt"
                  value={receiptQuery}
                  onChange={handleReceiptChange}
                  placeholder={t('pos.returnReceiptPh')}
                  className="pos-return-modal__input pos-return-modal__input--digits"
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                  inputMode="text"
                  aria-describedby="pos-return-receipt-hint"
                />
                {lookupPending ? (
                  <Loader size={18} className="pos-return-modal__input-spinner pos-return-modal__spin" aria-hidden />
                ) : null}
              </div>
            </div>
            <p id="pos-return-receipt-hint" className="pos-return-modal__receipt-hint">
              {t('pos.returnReceiptDigitsHint')}
            </p>
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
              <p className="pos-return-modal__preview-total">
                {t('pos.returnSelectedTotal')}: <strong>{fmt(totalSelected)}</strong>
              </p>
              <div className="pos-return-modal__select-all-wrap">
                <button type="button" className="pos-return-modal__select-all" onClick={selectAllMax}>
                  {t('pos.returnSelectAll')}
                </button>
              </div>
              <SaleReturnLinesEditor sale={sale} qtyByItemId={qtyByItemId} onQtyChange={setQty} />
            </section>
          ) : (
            <div className="pos-return-modal__placeholder">
              <Receipt size={28} strokeWidth={1.5} aria-hidden />
              <p>{lookupPending ? t('pos.returnSearching') : t('pos.returnSearchPrompt')}</p>
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
            disabled={!sale || returnMutation.isPending}
            onClick={() => returnMutation.mutate()}
          >
            {returnMutation.isPending ? (
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
