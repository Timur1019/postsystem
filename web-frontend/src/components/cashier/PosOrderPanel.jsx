// src/components/cashier/PosOrderPanel.jsx
import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, Trash2, RotateCcw, Percent, Banknote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { lineDiscountAmount, lineSubtotal } from '../../store/cartStore';
import { fmtMoney as fmt } from '../../utils/formatMoney';

export default function PosOrderPanel({
  items,
  selectedLineId,
  onSelectLine,
  onQtyDelta,
  onUpdatePrice,
  onUpdateDiscountPercent,
  onRemove,
  onClear,
  onReturn,
  total,
  discountTotal,
  onCheckout,
  checkoutDisabled,
  className = '',
}) {
  const { t } = useTranslation();
  const rowRefs = useRef({});
  const selected = items.find((i) => i.productId === selectedLineId);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [priceDraft, setPriceDraft] = useState('');

  useEffect(() => {
    if (!selectedLineId) return;
    rowRefs.current[selectedLineId]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedLineId, items]);

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discountPct =
    items.length > 0
      ? Math.round(
          (items.reduce((s, i) => s + lineDiscountAmount(i), 0) / Math.max(1, subtotal)) * 100
        )
      : 0;

  const commitPrice = (productId) => {
    const num = Number(String(priceDraft).replace(',', '.'));
    if (!Number.isNaN(num)) onUpdatePrice(productId, num);
    setEditingPriceId(null);
  };

  return (
    <section className={`pos-order-panel${className ? ` ${className}` : ''}`}>
      <header className="pos-order-panel__head">
        <h2 className="pos-order-panel__title">{t('pos.orderTitle')}</h2>
        <div className="pos-order-panel__actions">
          {onReturn && (
            <button type="button" className="pos-order-panel__link pos-order-panel__link--warn" onClick={onReturn}>
              {t('pos.return')}
            </button>
          )}
          {items.length > 0 && (
            <button type="button" className="pos-order-panel__link pos-order-panel__link--danger" onClick={onClear}>
              {t('pos.clearCart')}
            </button>
          )}
        </div>
      </header>

      <div className="pos-order-panel__list">
        {items.length === 0 ? (
          <p className="pos-order-panel__empty">{t('pos.cartEmpty')}</p>
        ) : (
          <ul className="pos-cart-lines">
            {items.map((item) => {
              const active = selectedLineId === item.productId;
              return (
                <li
                  key={item.productId}
                  ref={(el) => {
                    if (el) rowRefs.current[item.productId] = el;
                    else delete rowRefs.current[item.productId];
                  }}
                  className={`pos-cart-line${active ? ' is-active' : ''}`}
                  onClick={() => onSelectLine(item.productId)}
                >
                  <div className="pos-cart-line__main">
                    <div className="pos-cart-line__info">
                      <p className="pos-cart-line__name">{item.name}</p>
                      {editingPriceId === item.productId ? (
                        <input
                          type="number"
                          step="0.01"
                          className="pos-cart-line__price-input"
                          value={priceDraft}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setPriceDraft(e.target.value)}
                          onBlur={() => commitPrice(item.productId)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitPrice(item.productId);
                            if (e.key === 'Escape') setEditingPriceId(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <button
                          type="button"
                          className="pos-cart-line__unit"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPriceId(item.productId);
                            setPriceDraft(String(item.unitPrice));
                          }}
                        >
                          {fmt(item.unitPrice)} / {t('pos.unitPcs')}
                        </button>
                      )}
                    </div>

                    <div
                      className="pos-qty-control"
                      onClick={(e) => e.stopPropagation()}
                      role="group"
                      aria-label={t('pos.colQty')}
                    >
                      <button type="button" className="pos-qty-control__btn" onClick={() => onQtyDelta(item.productId, -1)}>
                        <Minus size={18} strokeWidth={2} />
                      </button>
                      <span className="pos-qty-control__val">{item.quantity}</span>
                      <button type="button" className="pos-qty-control__btn" onClick={() => onQtyDelta(item.productId, 1)}>
                        <Plus size={18} strokeWidth={2} />
                      </button>
                    </div>

                    <span className="pos-cart-line__sum">{fmt(lineSubtotal(item))}</span>
                  </div>
                  {lineDiscountAmount(item) > 0 && (
                    <p className="pos-cart-line__disc">
                      −{fmt(lineDiscountAmount(item))} ({item.discountPercent ?? 0}%)
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="pos-order-panel__bottom">
      {selected && (
        <div className="pos-line-toolbar">
          <div className="pos-line-toolbar__discount">
            <Percent size={15} aria-hidden />
            <span>{t('pos.lineDiscount')}</span>
            <button type="button" onClick={() => onUpdateDiscountPercent(selected.productId, Math.max(0, (Number(selected.discountPercent) || 0) - 1))}>
              <Minus size={16} />
            </button>
            <input
              type="text"
              inputMode="decimal"
              value={selected.discountPercent ?? 0}
              onChange={(e) => {
                const v = e.target.value.replace(',', '.');
                if (v === '' || v === '.') {
                  onUpdateDiscountPercent(selected.productId, 0);
                  return;
                }
                const n = Number(v);
                if (!Number.isNaN(n)) onUpdateDiscountPercent(selected.productId, n);
              }}
            />
            <span>%</span>
            <button type="button" onClick={() => onUpdateDiscountPercent(selected.productId, Math.min(100, (Number(selected.discountPercent) || 0) + 1))}>
              <Plus size={16} />
            </button>
          </div>
          <button type="button" className="pos-line-toolbar__remove" onClick={() => onRemove(selected.productId)} title={t('common.delete')}>
            <Trash2 size={18} />
          </button>
        </div>
      )}

      <footer className="pos-order-panel__foot">
        <div className="pos-order-panel__row">
          <span>{t('pos.subtotal')}</span>
          <span>{fmt(subtotal)}</span>
        </div>
        <div className="pos-order-panel__row pos-order-panel__row--disc">
          <span>
            {t('pos.discount')}
            {discountPct > 0 ? ` ${discountPct}%` : ''}
          </span>
          <span>−{fmt(discountTotal)}</span>
        </div>
        <div className="pos-order-panel__row pos-order-panel__row--total">
          <span>{t('pos.total')}</span>
          <span>{fmt(total)}</span>
        </div>
        <button type="button" className="pos-checkout-btn" disabled={checkoutDisabled} onClick={onCheckout}>
          <Banknote size={22} strokeWidth={1.75} />
          <span>
            {t('pos.toPayment')} — {fmt(total)}
          </span>
        </button>
      </footer>
      </div>
    </section>
  );
}
