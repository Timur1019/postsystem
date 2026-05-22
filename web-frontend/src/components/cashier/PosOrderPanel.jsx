// src/components/cashier/PosOrderPanel.jsx
import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, Trash2, Percent } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { lineDiscountAmount, lineSubtotal, useCartStore } from '../../store/cartStore';
import { fmtMoney as fmt, fmtMoneyCompact as fmtCompact } from '../../utils/formatMoney';

export default function PosOrderPanel({
  items,
  selectedLineId,
  onSelectLine,
  onQtyDelta,
  onUpdatePrice,
  onUpdateDiscountPercent,
  onRemove,
  total,
  className = '',
  variant = 'default',
  showTotalsFoot = false,
}) {
  const { t } = useTranslation();
  const getTaxTotal = useCartStore((s) => s.getTaxTotal);
  const taxTotal = getTaxTotal();
  const linesTotal = items.reduce((s, i) => s + lineSubtotal(i), 0);
  const payableTotal = total ?? linesTotal;
  const subtotalBeforeTax = Math.max(0, payableTotal - taxTotal);
  const taxRateLabel =
    items.length === 0 ? 0 : Math.round(items.reduce((s, i) => s + (i.taxRate ?? 0), 0) / items.length);
  const isRegister = variant === 'register';
  const rowRefs = useRef({});
  const selected = items.find((i) => i.productId === selectedLineId);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [priceDraft, setPriceDraft] = useState('');

  useEffect(() => {
    if (!selectedLineId) return;
    rowRefs.current[selectedLineId]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedLineId, items]);

  const commitPrice = (productId) => {
    const num = Number(String(priceDraft).replace(',', '.'));
    if (!Number.isNaN(num)) onUpdatePrice(productId, num);
    setEditingPriceId(null);
  };

  return (
    <section
      className={`pos-order-panel${isRegister ? ' pos-order-panel--register' : ''}${
        className ? ` ${className}` : ''
      }`}
    >
      <header className="pos-order-panel__head">
        <h2 className="pos-order-panel__title">
          {isRegister ? t('pos.currentCheck') : t('pos.orderTitle')}
          {items.length > 0 ? (
            <span className="pos-order-panel__badge">{t('pos.orderPositions', { count: items.length })}</span>
          ) : null}
        </h2>
      </header>

      <div className="pos-order-panel__list">
        <div className="pos-cart-table">
          <div className="pos-cart-table__head" role="row">
            <span className="pos-cart-table__col pos-cart-table__col--name">{t('pos.colName')}</span>
            <span className="pos-cart-table__col pos-cart-table__col--price">{t('pos.colPrice')}</span>
            <span className="pos-cart-table__col pos-cart-table__col--qty">{t('pos.colQty')}</span>
            <span className="pos-cart-table__col pos-cart-table__col--sum">{t('pos.colSum')}</span>
            <span className="pos-cart-table__col pos-cart-table__col--remove" aria-hidden />
          </div>
          <ul className="pos-cart-table__body">
            {items.length === 0 ? (
              <li className="pos-cart-table__row pos-cart-table__row--empty" role="row">
                <div className="pos-cart-table__col pos-cart-table__col--name">
                  <span className="pos-cart-table__empty-hint">{t('pos.cartEmpty')}</span>
                </div>
                <div className="pos-cart-table__col pos-cart-table__col--price" aria-hidden />
                <div className="pos-cart-table__col pos-cart-table__col--qty" aria-hidden />
                <div className="pos-cart-table__col pos-cart-table__col--sum" aria-hidden />
                <div className="pos-cart-table__col pos-cart-table__col--remove" aria-hidden />
              </li>
            ) : (
              items.map((item) => {
                const active = selectedLineId === item.productId;
                const lineSum = lineSubtotal(item);
                return (
                  <li
                    key={item.productId}
                    ref={(el) => {
                      if (el) rowRefs.current[item.productId] = el;
                      else delete rowRefs.current[item.productId];
                    }}
                    className={`pos-cart-table__row${active ? ' is-active' : ''}`}
                    role="row"
                    onClick={() => onSelectLine(item.productId)}
                  >
                    <div className="pos-cart-table__col pos-cart-table__col--name">
                      <span className="pos-cart-table__name" title={item.name}>
                        {item.name}
                      </span>
                      {item.sku ? (
                        <span className="pos-cart-table__sku" title={item.sku}>
                          {item.sku}
                        </span>
                      ) : null}
                    </div>

                    <div className="pos-cart-table__col pos-cart-table__col--price">
                      {editingPriceId === item.productId ? (
                        <input
                          type="number"
                          step="0.01"
                          className="pos-cart-table__price-input"
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
                          className="pos-cart-table__price-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPriceId(item.productId);
                            setPriceDraft(String(item.unitPrice));
                          }}
                        >
                          <span title={fmt(item.unitPrice)}>{fmtCompact(item.unitPrice)}</span>
                        </button>
                      )}
                    </div>

                    <div className="pos-cart-table__col pos-cart-table__col--qty" onClick={(e) => e.stopPropagation()}>
                      <div className="pos-qty-control pos-qty-control--compact" role="group" aria-label={t('pos.colQty')}>
                        <button type="button" className="pos-qty-control__btn" onClick={() => onQtyDelta(item.productId, -1)}>
                          <Minus size={14} strokeWidth={2} />
                        </button>
                        <span className="pos-qty-control__val">{item.quantity}</span>
                        <button type="button" className="pos-qty-control__btn" onClick={() => onQtyDelta(item.productId, 1)}>
                          <Plus size={14} strokeWidth={2} />
                        </button>
                      </div>
                    </div>

                    <div className="pos-cart-table__col pos-cart-table__col--sum">
                      <span className="pos-cart-table__money pos-cart-table__sum" title={fmt(lineSum)}>
                        {fmtCompact(lineSum)}
                      </span>
                    </div>

                    <div className="pos-cart-table__col pos-cart-table__col--remove" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="pos-cart-table__remove-btn"
                        onClick={() => onRemove(item.productId)}
                        aria-label={t('pos.removeLine', { name: item.name })}
                        title={t('common.delete')}
                      >
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    </div>

                    {lineDiscountAmount(item) > 0 && (
                      <p className="pos-cart-table__disc">
                        −{fmt(lineDiscountAmount(item))} ({item.discountPercent ?? 0}%)
                      </p>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>

      {isRegister && showTotalsFoot && items.length > 0 ? (
        <footer className="pos-order-panel__totals-foot">
          <div className="pos-order-panel__totals-meta">
            <p>
              {t('pos.subtotal')}: <span>{fmt(subtotalBeforeTax)}</span>
            </p>
            <p>
              {t('pos.taxLine', { rate: taxRateLabel })}: <span>{fmt(taxTotal)}</span>
            </p>
          </div>
          <div className="pos-order-panel__totals-hero">
            <span className="pos-order-panel__totals-hero-label">{t('pos.totalPayable')}</span>
            <strong className="pos-order-panel__totals-hero-value">{fmt(payableTotal)}</strong>
          </div>
        </footer>
      ) : null}

      <div className="pos-order-panel__bottom">
        {selected && !isRegister && (
          <div className="pos-line-toolbar">
            <div className="pos-line-toolbar__discount">
              <Percent size={15} aria-hidden />
              <span>{t('pos.lineDiscount')}</span>
              <button
                type="button"
                onClick={() =>
                  onUpdateDiscountPercent(selected.productId, Math.max(0, (Number(selected.discountPercent) || 0) - 1))
                }
              >
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
              <button
                type="button"
                onClick={() =>
                  onUpdateDiscountPercent(
                    selected.productId,
                    Math.min(100, (Number(selected.discountPercent) || 0) + 1)
                  )
                }
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              type="button"
              className="pos-line-toolbar__remove"
              onClick={() => onRemove(selected.productId)}
              title={t('common.delete')}
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
