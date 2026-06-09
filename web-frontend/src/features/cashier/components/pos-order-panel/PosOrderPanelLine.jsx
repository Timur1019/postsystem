import { Minus, Plus, Trash2 } from 'lucide-react';
import { lineDiscountAmount, lineSubtotal } from '../../../../store/cartStore';
import { fmtMoney as fmt, fmtMoneyCompact as fmtCompact } from '../../../../utils/formatMoney';
import { formatQtyParts } from '../../../../utils/quantityFormat';

export default function PosOrderPanelLine({
  item,
  active,
  rowRef,
  onSelectLine,
  onQtyDelta,
  onRemove,
  editingPriceLineId,
  priceDraft,
  setPriceDraft,
  setEditingPriceLineId,
  commitPrice,
  editingQtyLineId,
  qtyDraft,
  setQtyDraft,
  startQtyEdit,
  commitQty,
  setEditingQtyLineId,
  t,
}) {
  const lineSum = lineSubtotal(item);
  const isWeight = item.saleType === 'WEIGHT';
  const qtyParts = formatQtyParts(item.quantity, item.saleType, item.unitCode);
  const isEditingQty = editingQtyLineId === item.lineId;

  return (
    <li
      ref={rowRef}
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
}
