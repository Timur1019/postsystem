import { useEffect, useRef, useState } from 'react';
import { lineSubtotal, useCartStore } from '../../../store/cartStore';
import {
  parseQtyInput,
  qtyToEditString,
} from '../../../utils/quantityFormat';

export function usePosOrderPanel({
  items,
  selectedLineId,
  onUpdateQuantity,
  onUpdatePrice,
  total,
}) {
  const getTaxTotal = useCartStore((s) => s.getTaxTotal);
  const taxTotal = getTaxTotal();
  const linesTotal = items.reduce((s, i) => s + lineSubtotal(i), 0);
  const payableTotal = total ?? linesTotal;
  const subtotalBeforeTax = Math.max(0, payableTotal - taxTotal);
  const taxRateLabel =
    items.length === 0 ? 0 : Math.round(items.reduce((s, i) => s + (i.taxRate ?? 0), 0) / items.length);

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

  return {
    taxTotal,
    payableTotal,
    subtotalBeforeTax,
    taxRateLabel,
    rowRefs,
    selected,
    editingPriceLineId,
    setEditingPriceLineId,
    priceDraft,
    setPriceDraft,
    editingQtyLineId,
    setEditingQtyLineId,
    qtyDraft,
    setQtyDraft,
    commitPrice,
    startQtyEdit,
    commitQty,
  };
}
