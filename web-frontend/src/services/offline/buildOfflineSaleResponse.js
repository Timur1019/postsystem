import { extractVatFromInclusive, round2 } from '../../utils/taxAmounts';
import {
  buildCheckoutLineItems,
  lineDiscountAmount,
  lineSubtotal,
} from '../../store/cartStore';

function mapLineItems(cartItems) {
  return cartItems.map((item) => {
    const gross = lineSubtotal(item);
    const tax = extractVatFromInclusive(gross, item.taxRate);
    return {
      id: item.lineId,
      productName: item.name,
      saleType: item.saleType || 'PIECE',
      unitOfMeasure: item.unitLabel || item.unitCode || 'pcs',
      quantity: item.quantity,
      returnedQuantity: 0,
      returnableQuantity: item.quantity,
      unitPrice: round2(item.unitPrice),
      lineTotal: gross,
      taxAmount: tax,
      lineDiscount: lineDiscountAmount(item),
      taxRatePercent: item.taxRate,
      ikpu: item.ikpu || null,
      productSku: item.sku || null,
    };
  });
}

function resolvePayAmounts(payment, total) {
  const payTotal = round2(total);
  if (payment.paymentMethod === 'MIXED') {
    const cash = round2(Math.min(payment.cashAmount ?? payTotal, payTotal));
    const card = round2(Math.max(0, payTotal - cash));
    return { cashAmount: cash, cardAmount: card, amountTendered: payment.amountTendered ?? cash };
  }
  if (payment.paymentMethod === 'CARD') {
    return { cashAmount: 0, cardAmount: payTotal, amountTendered: payTotal };
  }
  const tendered = payment.amountTendered ?? payTotal;
  return {
    cashAmount: payTotal,
    cardAmount: 0,
    amountTendered: tendered,
    changeGiven: round2(Math.max(0, tendered - payTotal)),
  };
}

/**
 * SaleResponse-подобный объект для UI и ESC/POS из локальной корзины.
 */
export function buildOfflineSaleResponse({
  clientSaleId,
  receiptNumber,
  payment,
  customerName = null,
  storeId,
  storeName,
  cashierName,
  shift,
  cartItems,
  orderDiscountAmount,
  orderDiscountPercent,
}) {
  const items = mapLineItems(cartItems);
  const linesTotal = round2(cartItems.reduce((acc, item) => acc + lineSubtotal(item), 0));
  const lineDiscountTotal = round2(cartItems.reduce((acc, item) => acc + lineDiscountAmount(item), 0));
  const orderDiscount = round2(Math.min(orderDiscountAmount ?? 0, linesTotal));
  const subtotal = round2(
    cartItems.reduce((acc, item) => acc + (lineSubtotal(item) - extractVatFromInclusive(lineSubtotal(item), item.taxRate)), 0)
  );
  const taxTotal = round2(
    cartItems.reduce((acc, item) => acc + extractVatFromInclusive(lineSubtotal(item), item.taxRate), 0)
  );
  const totalAmount = round2(linesTotal - orderDiscount);
  const pay = resolvePayAmounts(payment, totalAmount);
  const createdAt = new Date().toISOString();

  return {
    id: clientSaleId,
    clientSaleId,
    receiptNumber,
    cashierName: cashierName || '',
    storeId: Number(storeId),
    storeName: storeName || '',
    customerName: customerName || payment.customerName || null,
    createdAt,
    items,
    subtotal,
    taxTotal,
    discountTotal: round2(lineDiscountTotal + orderDiscount),
    lineDiscountTotal,
    orderDiscountAmount: orderDiscount,
    orderDiscountPercent: orderDiscountPercent ?? 0,
    totalAmount,
    returnAmount: 0,
    paymentMethod: payment.paymentMethod,
    cardType: payment.cardType || null,
    cashAmount: pay.cashAmount,
    cardAmount: pay.cardAmount,
    receiptType: payment.receiptType || 'SALE',
    amountTendered: pay.amountTendered,
    changeGiven: pay.changeGiven ?? 0,
    status: 'COMPLETED',
    shiftId: shift?.id || shift?.clientShiftId,
    shiftOpenedAt: shift?.openedAt,
    shiftClosedAt: null,
    shiftStatus: shift?.status || 'OPEN',
    shiftZReportId: null,
    offlinePendingSync: true,
  };
}

export function buildOfflineCheckoutPayload({
  storeId,
  payment,
  cartItems,
  orderDiscountAmount,
  orderDiscountPercent,
}) {
  return {
    storeId: Number(storeId),
    paymentMethod: payment.paymentMethod,
    receiptType: payment.receiptType || 'SALE',
    cardType: payment.cardType,
    cashAmount: payment.cashAmount,
    cardAmount: payment.cardAmount,
    amountTendered: payment.amountTendered,
    customerId: payment.customerId || undefined,
    items: buildCheckoutLineItems(cartItems),
    orderDiscountAmount: orderDiscountAmount ?? 0,
    orderDiscountPercent: orderDiscountPercent ?? 0,
  };
}
