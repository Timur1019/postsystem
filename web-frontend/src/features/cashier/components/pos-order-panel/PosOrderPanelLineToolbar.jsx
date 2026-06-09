import { Minus, Plus, Percent, Trash2 } from 'lucide-react';

export default function PosOrderPanelLineToolbar({
  t,
  selected,
  onUpdateDiscountPercent,
  onRemove,
}) {
  if (!selected) return null;

  return (
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
  );
}
