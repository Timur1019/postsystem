import { useTranslation } from 'react-i18next';
import { usePosOrderPanel } from '../hooks/usePosOrderPanel';
import PosOrderPanelLine from './pos-order-panel/PosOrderPanelLine';
import PosOrderPanelLineToolbar from './pos-order-panel/PosOrderPanelLineToolbar';
import PosOrderPanelTotalsFoot from './pos-order-panel/PosOrderPanelTotalsFoot';

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
  const isRegister = variant === 'register';
  const p = usePosOrderPanel({
    items,
    selectedLineId,
    onUpdateQuantity,
    onUpdatePrice,
    total,
  });

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
              items.map((item) => (
                <PosOrderPanelLine
                  key={item.lineId}
                  item={item}
                  active={selectedLineId === item.lineId}
                  rowRef={(el) => {
                    if (el) p.rowRefs.current[item.lineId] = el;
                    else delete p.rowRefs.current[item.lineId];
                  }}
                  onSelectLine={onSelectLine}
                  onQtyDelta={onQtyDelta}
                  onRemove={onRemove}
                  editingPriceLineId={p.editingPriceLineId}
                  priceDraft={p.priceDraft}
                  setPriceDraft={p.setPriceDraft}
                  setEditingPriceLineId={p.setEditingPriceLineId}
                  commitPrice={p.commitPrice}
                  editingQtyLineId={p.editingQtyLineId}
                  setEditingQtyLineId={p.setEditingQtyLineId}
                  qtyDraft={p.qtyDraft}
                  setQtyDraft={p.setQtyDraft}
                  startQtyEdit={p.startQtyEdit}
                  commitQty={p.commitQty}
                  t={t}
                />
              ))
            )}
          </ul>
        </div>
      </div>

      {isRegister && showTotalsFoot && items.length > 0 ? (
        <PosOrderPanelTotalsFoot
          t={t}
          subtotalBeforeTax={p.subtotalBeforeTax}
          taxTotal={p.taxTotal}
          taxRateLabel={p.taxRateLabel}
          payableTotal={p.payableTotal}
        />
      ) : null}

      <div className="pos-order-panel__bottom">
        {!isRegister ? (
          <PosOrderPanelLineToolbar
            t={t}
            selected={p.selected}
            onUpdateDiscountPercent={onUpdateDiscountPercent}
            onRemove={onRemove}
          />
        ) : null}
      </div>
    </section>
  );
}
