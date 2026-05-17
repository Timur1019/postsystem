// src/components/cashier/PosOrderPanel.jsx
import { useEffect, useRef } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const fmt = (n) =>
  new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);

export default function PosOrderPanel({
  items,
  selectedLineId,
  onSelectLine,
  onUpdateQty,
  onRemove,
  onClear,
  total,
  itemCount,
  onCheckout,
  checkoutDisabled,
}) {
  const { t } = useTranslation();
  const rowRefs = useRef({});

  useEffect(() => {
    if (!selectedLineId) return;
    rowRefs.current[selectedLineId]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedLineId, items]);

  return (
    <section className="pos-order-panel">
      <div className="pos-order-panel__head">
        <h2 className="pos-order-panel__title">{t('pos.orderTitle')}</h2>
        {items.length > 0 && (
          <button type="button" className="pos-order-panel__clear" onClick={onClear}>
            {t('pos.clearCart')}
          </button>
        )}
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
                  </td>
                  <td className="text-right">{fmt(item.unitPrice)}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right font-semibold">{fmt(item.unitPrice * item.quantity)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedLineId && items.some((i) => i.productId === selectedLineId) && (
        <div className="pos-order-qty-bar">
          <button type="button" className="pos-order-qty-btn" onClick={() => onUpdateQty(selectedLineId, -1)}>
            <Minus size={18} />
          </button>
          <button
            type="button"
            className="pos-order-qty-btn pos-order-qty-btn--danger"
            onClick={() => onRemove(selectedLineId)}
          >
            <Trash2 size={16} />
          </button>
          <button type="button" className="pos-order-qty-btn" onClick={() => onUpdateQty(selectedLineId, 1)}>
            <Plus size={18} />
          </button>
        </div>
      )}

      <footer className="pos-order-panel__footer">
        <div className="pos-order-totals">
          <div className="pos-order-totals__row">
            <span>{t('pos.discount')}</span>
            <span>0%</span>
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
