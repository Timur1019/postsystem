/**
 * Собирает данные чека возврата для печати (только выбранные позиции и суммы).
 */
export function buildReturnReceiptSale(originalSale, qtyByItemId, opts = {}) {
  if (!originalSale) return null;

  const reason = opts.reason?.trim() || '';

  const items = (originalSale.items ?? [])
    .filter((line) => line.id && (qtyByItemId[line.id] ?? 0) > 0)
    .map((line) => {
      const qty = qtyByItemId[line.id];
      const soldQty = Number(line.quantity) || 1;
      const unit =
        line.lineTotal != null && soldQty > 0
          ? Number(line.lineTotal) / soldQty
          : Number(line.unitPrice) || 0;
      const lineTotal = unit * qty;
      const soldTax = Number(line.taxAmount) || 0;
      const taxAmount = soldTax > 0 && soldQty > 0 ? (soldTax / soldQty) * qty : 0;

      return {
        ...line,
        quantity: qty,
        unitPrice: unit,
        lineTotal,
        taxAmount,
        lineDiscount: 0,
      };
    });

  const totalAmount = items.reduce((sum, line) => sum + Number(line.lineTotal), 0);
  const taxTotal = items.reduce((sum, line) => sum + Number(line.taxAmount || 0), 0);
  const origTotal = Number(originalSale.totalAmount) || 1;
  const ratio = origTotal > 0 ? totalAmount / origTotal : 1;

  const method = originalSale.paymentMethod;
  let cashAmount = Number(originalSale.cashAmount) || 0;
  let cardAmount = Number(originalSale.cardAmount) || 0;
  let amountTendered = totalAmount;

  if (method === 'CASH') {
    cashAmount = totalAmount;
    cardAmount = 0;
  } else if (method === 'CARD') {
    cashAmount = 0;
    cardAmount = totalAmount;
  } else if (method === 'MIXED') {
    cashAmount = cashAmount * ratio;
    cardAmount = cardAmount * ratio;
  }

  return {
    ...originalSale,
    items,
    subtotal: totalAmount - taxTotal,
    taxTotal,
    discountTotal: 0,
    lineDiscountTotal: 0,
    orderDiscountAmount: 0,
    orderDiscountPercent: 0,
    totalAmount,
    returnAmount: totalAmount,
    cashAmount,
    cardAmount,
    amountTendered,
    changeGiven: 0,
    receiptDocumentType: 'RETURN',
    createdAt: new Date().toISOString(),
    returnReason: reason,
  };
}
