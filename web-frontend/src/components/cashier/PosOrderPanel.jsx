// src/components/cashier/PosOrderPanel.jsx
import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, Trash2, RotateCcw, Percent } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { lineDiscountAmount, lineSubtotal } from '../../store/cartStore';

const fmt = (n) =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);

function EditableCell({ value, display, onCommit, align = 'right', className = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) {
      setDraft(String(value ?? ''));
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, value]);

  const commit = () => {
    const num = Number(String(draft).replace(',', '.'));
    if (!Number.isNaN(num)) {
      onCommit(num);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <td className={className} onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="number"
          step="0.01"
          min="0"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="pos-order-table__edit-input"
        />
      </td>
    );
  }

  return (
    <td
      className={`${className} pos-order-table__editable`}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
    >
      <span className={align === 'center' ? 'block text-center' : align === 'right' ? 'block text-right' : ''}>
        {display ?? fmt(value)}
      </span>
    </td>
  );
}

export default function PosOrderPanel({
  items,
  selectedLineId,
  onSelectLine,
  onQtyDelta,
  onSetQuantity,
  onUpdatePrice,
  onUpdateLineSubtotal,
  onUpdateDiscountPercent,
  onRemove,
  onClear,
  onReturn,
  total,
  discountTotal,
  itemCount,
  onCheckout,
  checkoutDisabled,
}) {
  const { t } = useTranslation();
  const rowRefs = useRef({});
  const selected = items.find((i) => i.productId === selectedLineId);

  useEffect(() => {
    if (!selectedLineId) return;
    rowRefs.current[selectedLineId]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedLineId, items]);

  const discountPct =
    items.length > 0
      ? Math.round(
          (items.reduce((s, i) => s + lineDiscountAmount(i), 0) /
            Math.max(
              1,
              items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
            )) *
            100
        )
      : 0;

  return (
    <section className="pos-order-panel">
      <div className="pos-order-panel__head">
        <h2 className="pos-order-panel__title">{t('pos.orderTitle')}</h2>
        <div className="pos-order-panel__head-actions">
          {onReturn && (
            <button type="button" className="pos-order-panel__return" onClick={onReturn}>
              <RotateCcw size={14} />
              {t('pos.return')}
            </button>
          )}
          {items.length > 0 && (
            <button type="button" className="pos-order-panel__clear" onClick={onClear}>
              {t('pos.clearCart')}
            </button>
          )}
        </div>
      </div>

      <div className="pos-order-table-wrap">
        <table className="pos-order-table">
          <thead>
            <tr>
              <th>{t('pos.colNo')}</th>
              <th>{t('pos.colName')}</th>
              <th className="text-right">{t('pos.colPrice')}</th>
              <th className="text-center">{t('pos.colQty')}</th>
              <th className="text-right">{t('pos.colSum')}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="pos-order-table__empty">
                  {t('pos.cartEmpty')}
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr
                  key={item.productId}
                  ref={(el) => {
                    if (el) rowRefs.current[item.productId] = el;
                    else delete rowRefs.current[item.productId];
                  }}
                  className={selectedLineId === item.productId ? 'pos-order-table__row--active' : ''}
                  onClick={() => onSelectLine(item.productId)}
                >
                  <td>{idx + 1}</td>
                  <td>
                    <span className="pos-order-table__name">{item.name}</span>
                    <span className="pos-order-table__sku">{item.sku}</span>
                    {lineDiscountAmount(item) > 0 && (
                      <span className="pos-order-table__disc-badge">
                        −{fmt(lineDiscountAmount(item))} ({item.discountPercent ?? 0}%)
                      </span>
                    )}
                  </td>
                  <EditableCell
                    value={item.unitPrice}
                    className="text-right"
                    onCommit={(v) => onUpdatePrice(item.productId, v)}
                  />
                  <EditableCell
                    value={item.quantity}
                    display={item.quantity}
                    align="center"
                    className="text-center"
                    onCommit={(v) => onSetQuantity(item.productId, Math.round(v))}
                  />
                  <EditableCell
                    value={lineSubtotal(item)}
                    className="text-right font-semibold"
                    onCommit={(v) => onUpdateLineSubtotal(item.productId, v)}
                  />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="pos-line-toolbar">
          <div className="pos-line-toolbar__group">
            <span className="pos-line-toolbar__label">{t('pos.colQty')}</span>
            <button type="button" className="pos-line-toolbar__btn" onClick={() => onQtyDelta(selected.productId, -1)}>
              <Minus size={16} />
            </button>
            <span className="pos-line-toolbar__value">{selected.quantity}</span>
            <button type="button" className="pos-line-toolbar__btn" onClick={() => onQtyDelta(selected.productId, 1)}>
              <Plus size={16} />
            </button>
          </div>

          <div className="pos-line-toolbar__divider" aria-hidden />

          <div className="pos-line-toolbar__group pos-line-toolbar__group--discount">
            <Percent size={14} className="text-amber-600 shrink-0" aria-hidden />
            <span className="pos-line-toolbar__label">{t('pos.lineDiscount')}</span>
            <button
              type="button"
              className="pos-line-toolbar__btn"
              onClick={() =>
                onUpdateDiscountPercent(
                  selected.productId,
                  Math.max(0, (Number(selected.discountPercent) || 0) - 1)
                )
              }
            >
              <Minus size={16} />
            </button>
            <input
              type="text"
              inputMode="decimal"
              className="pos-line-toolbar__discount-input"
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
            <span className="pos-line-toolbar__pct">%</span>
            <button
              type="button"
              className="pos-line-toolbar__btn"
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
            className="pos-line-toolbar__btn pos-line-toolbar__btn--danger"
            onClick={() => onRemove(selected.productId)}
            title={t('common.delete')}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      <footer className="pos-order-panel__footer">
        <div className="pos-order-totals">
          <div className="pos-order-totals__row">
            <span>{t('pos.discount')}</span>
            <span>
              {discountPct > 0 ? `${discountPct}%` : '0%'} · −{fmt(discountTotal)} сум
            </span>
          </div>
          <div className="pos-order-totals__grand">
            <span>{t('pos.total')}</span>
            <span>{fmt(total)} сум</span>
          </div>
        </div>
        <button
          type="button"
          className="pos-order-pay-btn"
          disabled={checkoutDisabled}
          onClick={onCheckout}
        >
          {t('pos.toPayment')} ({itemCount()})
        </button>
      </footer>
    </section>
  );
}
