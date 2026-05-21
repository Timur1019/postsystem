import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus } from 'lucide-react';
import { fmtMoney as fmt } from '../../utils/formatMoney';

function returnableQty(line) {
  if (line.returnableQuantity != null) return line.returnableQuantity;
  const sold = line.quantity ?? 0;
  const returned = line.returnedQuantity ?? 0;
  return Math.max(0, sold - returned);
}

export function getReturnableLines(sale) {
  return (sale?.items ?? []).filter((line) => returnableQty(line) > 0);
}

export function buildReturnPayload(sale, qtyByItemId, reason) {
  const lines = (sale?.items ?? [])
    .filter((line) => line.id && (qtyByItemId[line.id] ?? 0) > 0)
    .map((line) => ({
      saleItemId: line.id,
      quantity: qtyByItemId[line.id],
    }));
  return { reason: reason?.trim() || '', lines };
}

export default function SaleReturnLinesEditor({ sale, qtyByItemId, onQtyChange, className = '' }) {
  const { t } = useTranslation();
  const returnable = useMemo(() => getReturnableLines(sale), [sale]);

  if (!sale) return null;

  if (returnable.length === 0) {
    return (
      <p className={`pos-return-modal__lines-empty ${className}`.trim()}>
        {t('pos.returnNoItems')}
      </p>
    );
  }

  return (
    <ul className={`pos-return-modal__lines pos-return-modal__lines--select ${className}`.trim()}>
      {returnable.map((line) => {
        const max = returnableQty(line);
        const qty = qtyByItemId[line.id] ?? 0;
        const unit =
          line.quantity > 0 && line.lineTotal != null
            ? Number(line.lineTotal) / line.quantity
            : Number(line.unitPrice) || 0;
        const lineReturnSum = unit * qty;

        return (
          <li key={line.id} className="pos-return-line-select">
            <div className="pos-return-line-select__top">
              <div className="pos-return-line-select__info">
                <span className="pos-return-modal__line-name">{line.productName}</span>
                <span className="pos-return-line-select__meta">
                  {t('pos.returnSold')}: {line.quantity}
                  {(line.returnedQuantity ?? 0) > 0 ? (
                    <span className="pos-return-line-select__returned">
                      {' '}
                      · {t('pos.returnAlready')}: {line.returnedQuantity}
                    </span>
                  ) : null}
                </span>
              </div>
              <span className="pos-return-line-select__sum">
                {qty > 0 ? fmt(lineReturnSum) : '—'}
              </span>
            </div>
            <div className="pos-return-line-select__actions">
              <div className="pos-return-qty-stepper" role="group" aria-label={line.productName}>
                <button
                  type="button"
                  className="pos-return-qty-stepper__btn pos-return-qty-stepper__btn--minus"
                  disabled={qty <= 0}
                  onClick={() => onQtyChange(line.id, Math.max(0, qty - 1))}
                  aria-label={t('pos.returnDecrease')}
                >
                  <Minus size={22} strokeWidth={2.5} aria-hidden />
                </button>
                <span className="pos-return-qty-stepper__value" aria-live="polite">
                  {qty}
                </span>
                <button
                  type="button"
                  className="pos-return-qty-stepper__btn pos-return-qty-stepper__btn--plus"
                  disabled={qty >= max}
                  onClick={() => onQtyChange(line.id, Math.min(max, qty + 1))}
                  aria-label={t('pos.returnIncrease')}
                >
                  <Plus size={22} strokeWidth={2.5} aria-hidden />
                </button>
              </div>
              <button
                type="button"
                className="pos-return-line-select__max"
                disabled={qty >= max}
                onClick={() => onQtyChange(line.id, max)}
              >
                {t('pos.returnMax')}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Хук начальных количеств для возврата (0 по умолчанию). */
export function useReturnQtyState(sale, open) {
  const [qtyByItemId, setQtyByItemId] = useState({});

  useEffect(() => {
    if (!open) {
      setQtyByItemId({});
      return;
    }
    const next = {};
    getReturnableLines(sale).forEach((line) => {
      if (line.id) next[line.id] = 0;
    });
    setQtyByItemId(next);
  }, [open, sale?.id]);

  const setQty = (itemId, value) => {
    setQtyByItemId((prev) => ({ ...prev, [itemId]: value }));
  };

  const selectAllMax = () => {
    const next = {};
    getReturnableLines(sale).forEach((line) => {
      if (line.id) next[line.id] = returnableQty(line);
    });
    setQtyByItemId(next);
  };

  const totalSelected = useMemo(() => {
    return (sale?.items ?? []).reduce((sum, line) => {
      const q = qtyByItemId[line.id] ?? 0;
      if (q <= 0) return sum;
      const unit =
        line.quantity > 0 && line.lineTotal != null
          ? Number(line.lineTotal) / line.quantity
          : Number(line.unitPrice) || 0;
      return sum + unit * q;
    }, 0);
  }, [sale, qtyByItemId]);

  return { qtyByItemId, setQty, selectAllMax, totalSelected };
}
