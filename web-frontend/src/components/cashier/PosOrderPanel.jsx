// src/components/cashier/PosOrderPanel.jsx
import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, Trash2, Percent } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { lineDiscountAmount, lineSubtotal, useCartStore } from '../../store/cartStore';
import { fmtMoney as fmt, fmtMoneyCompact as fmtCompact } from '../../utils/formatMoney';
import {
  formatQtyParts,
  parseQtyInput,
  qtyToEditString,
} from '../../utils/quantityFormat';

export default function PosOrderPanel({
  items,
  selectedLineId,
  onSelectLine,
  onQtyDelta,
  onUpdateQuantity,
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
  const selected = items.find((i) => i.lineId === selectedLineId);
  const [editingPriceLineId, setEditingPriceLineId] = useState(null);
  const [priceDraft, setPriceDraft] = useState('');
  const [editingQtyLineId, setEditingQtyLineId] = useState(null);
  const [qtyDraft, setQtyDraft] = useState('');

  useEffect(() => {
    if (!selectedLineId) return;
    rowRefs.current[selectedLineId]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedLineId, items]);

  const commitPrice = (lineId) => {
    const num = Number(String(priceDraft).replace(',', '.'));
    if (!Number.isNaN(num)) onUpdatePrice(lineId, num);
    setEditingPriceLineId(null);
  };

  const startQtyEdit = (item) => {
    setEditingQtyLineId(item.lineId);
    setQtyDraft(qtyToEditString(item.quantity, item.saleType, item.unitCode));
  };

  const commitQty = (item) => {
    const parsed = parseQtyInput(qtyDraft, item.saleType, item.unitCode);
    if (parsed != null) onUpdateQuantity(item.lineId, parsed);
    setEditingQtyLineId(null);
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
                const active = selectedLineId === item.lineId;
                const lineSum = lineSubtotal(item);
                const isWeight = item.saleType === 'WEIGHT';
                const qtyParts = formatQtyParts(item.quantity, item.saleType, item.unitCode);
                const isEditingQty = editingQtyLineId === item.lineId;
                return (
                  <li
                    key={item.lineId}
                    ref={(el) => {
                      if (el) rowRefs.current[item.lineId] = el;
                      else delete rowRefs.current[item.lineId];
                    }}
                    className={`pos-cart-table__row${active ? ' is-active' : ''}`}
                    role="row"
                    onClick={() => onSelectLine(item.lineId)}
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
                      {editingPriceLineId === item.lineId ? (
                        <input
                          type="number"
                          step="0.01"
                          className="pos-cart-table__price-input"
                          value={priceDraft}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setPriceDraft(e.target.value)}
                          onBlur={() => commitPrice(item.lineId)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitPrice(item.lineId);
                            if (e.key === 'Escape') setEditingPriceLineId(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <button
                          type="button"
                          className="pos-cart-table__price-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPriceLineId(item.lineId);
                            setPriceDraft(String(item.unitPrice));
                          }}
                        >
                          <span title={fmt(item.unitPrice)}>{fmtCompact(item.unitPrice)}</span>
                        </button>
                      )}
                    </div>

                    <div className="pos-cart-table__col pos-cart-table__col--qty" onClick={(e) => e.stopPropagation()}>
                      <div className="pos-qty-control pos-qty-control--compact" role="group" aria-label={t('pos.colQty')}>
                        <button
                          type="button"
                          className="pos-qty-control__btn"
                          onClick={() => onQtyDelta(item.lineId, -1)}
                          aria-label={t('pos.qtyDecrease')}
                        >
                          <Minus size={18} strokeWidth={2.25} />
                        </button>
                        {isEditingQty ? (
                          <input
                            type="text"
                            inputMode={isWeight ? 'decimal' : 'numeric'}
                            className="pos-qty-control__input"
                            value={qtyDraft}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setQtyDraft(e.target.value)}
                            onBlur={() => commitQty(item)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitQty(item);
                              if (e.key === 'Escape') setEditingQtyLineId(null);
                            }}
                            autoFocus
                            aria-label={t('pos.colQty')}
                          />
                        ) : (
                          <button
                            type="button"
                            className={`pos-qty-control__val pos-qty-control__val--editable${
                              isWeight ? ' pos-qty-control__val--weight' : ''
                            }`}
                            onClick={() => startQtyEdit(item)}
                            title={t('pos.qtyEditHint')}
                          >
                            <span className="pos-qty-control__val-inner">
                              <span className="pos-qty-control__num">{qtyParts.number}</span>
                              {qtyParts.unit ? (
                                <span className="pos-qty-control__unit">{qtyParts.unit}</span>
                              ) : null}
                            </span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="pos-qty-control__btn"
                          onClick={() => onQtyDelta(item.lineId, 1)}
                          aria-label={t('pos.qtyIncrease')}
                        >
                          <Plus size={18} strokeWidth={2.25} />
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
                        onClick={() => onRemove(item.lineId)}
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
                  onUpdateDiscountPercent(
                    selected.lineId,
                    Math.max(0, (Number(selected.discountPercent) || 0) - 1)
                  )
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
                    onUpdateDiscountPercent(selected.lineId, 0);
                    return;
                  }
                  const n = Number(v);
                  if (!Number.isNaN(n)) onUpdateDiscountPercent(selected.lineId, n);
                }}
              />
              <span>%</span>
              <button
                type="button"
                onClick={() =>
                  onUpdateDiscountPercent(
                    selected.lineId,
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
              onClick={() => onRemove(selected.lineId)}
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
