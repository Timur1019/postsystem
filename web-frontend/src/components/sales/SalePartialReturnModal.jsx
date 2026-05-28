import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Loader, RotateCcw, X } from 'lucide-react';
import { saleApi } from '../../services/api';
import PosModalPortal from '../cashier/PosModalPortal';
import { fmtMoney as fmt } from '../../utils/formatMoney';
import SaleReturnLinesEditor, {
  buildReturnPayload,
  getReturnableLines,
  useReturnQtyState,
} from './SaleReturnLinesEditor';

export default function SalePartialReturnModal({
  open,
  onClose,
  saleId,
  sale: saleProp,
  onSuccess,
  portal = true,
}) {
  const { t } = useTranslation();

  const { data: fetchedSale, isPending: saleLoading } = useQuery({
    queryKey: ['sale-for-return', saleId],
    queryFn: () => saleApi.getById(saleId).then((r) => r.data),
    enabled: open && !!saleId && !saleProp,
  });

  const sale = saleProp ?? fetchedSale;
  const [reason, setReason] = useState('');

  const { qtyByItemId, setQty, selectAllMax, totalSelected } = useReturnQtyState(sale, open);

  const returnMutation = useMutation({
    mutationFn: () => {
      const payload = buildReturnPayload(sale, qtyByItemId, reason || t('pos.returnDefaultReason'));
      if (!payload.lines.length) {
        return Promise.reject(new Error(t('pos.returnSelectQty')));
      }
      return saleApi.returnItems(sale.id, payload).then((r) => r.data);
    },
    onSuccess: () => {
      toast.success(t('pos.returnSuccess'));
      onClose();
      onSuccess?.();
    },
    onError: (e) => {
      const msg = e?.response?.data?.message ?? e?.message ?? t('pos.returnFailed');
      toast.error(msg);
    },
  });

  if (!open) return null;

  const returnable = getReturnableLines(sale);
  const canSubmit = sale && returnable.length > 0 && !returnMutation.isPending;

  const body = (
    <div
      className="pos-return-modal pos-return-modal--partial"
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
          <p className="pos-return-modal__hint">{t('pos.returnPartialHint')}</p>
        </div>
        <button
          type="button"
          className="pos-return-modal__close"
          onClick={onClose}
          aria-label={t('common.close')}
        >
          <X size={20} />
        </button>
      </header>

      <div className="pos-return-modal__body">
        {saleLoading && !sale ? (
          <p className="pos-return-modal__lines-empty">{t('common.loading')}</p>
        ) : sale ? (
          <>
            <div className="pos-return-modal__preview-head">
              <span className="pos-return-modal__preview-receipt">{sale.receiptNumber}</span>
              <span className="pos-return-modal__preview-total-inline">
                {t('pos.returnSelectedTotal')}: <strong>{fmt(totalSelected)}</strong>
              </span>
            </div>
            <div className="pos-return-modal__select-all-wrap">
              <button type="button" className="pos-return-modal__select-all" onClick={selectAllMax}>
                {t('pos.returnSelectAll')}
              </button>
            </div>
            <SaleReturnLinesEditor sale={sale} qtyByItemId={qtyByItemId} onQtyChange={setQty} />
          </>
        ) : null}

        <section className="pos-return-modal__section">
          <label className="pos-return-modal__label" htmlFor="partial-return-reason">
            {t('pos.returnReason')}
          </label>
          <textarea
            id="partial-return-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="pos-return-modal__textarea"
            placeholder={t('pos.returnReasonPh')}
          />
        </section>
      </div>

      <footer className="pos-return-modal__footer">
        <button type="button" className="pos-return-modal__cancel" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button
          type="button"
          className="pos-return-modal__submit"
          disabled={!canSubmit}
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
  );

  if (portal) {
    return (
      <PosModalPortal open={open} onClose={onClose}>
        {body}
      </PosModalPortal>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      {body}
    </div>
  );
}
