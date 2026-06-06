// src/store/cartStore.js
import { create } from 'zustand';
import { extractVatFromInclusive, netFromInclusive, round2 } from '../utils/taxAmounts';
import { isPieceLikeProduct, roundQty } from '../utils/quantityFormat';
import { unitLabel } from '../utils/unitConfig';

export const lineGross = (item) => round2(item.unitPrice * item.quantity);

export const lineDiscountAmount = (item) => {
  if (item.discount != null && item.discount > 0) {
    return round2(Math.min(item.discount, lineGross(item)));
  }
  const pct = Number(item.discountPercent) || 0;
  return round2(lineGross(item) * (pct / 100));
};

export const lineSubtotal = (item) => round2(lineGross(item) - lineDiscountAmount(item));

const capOrderDiscount = (items, orderDiscountAmount) => {
  const linesTotal = round2(items.reduce((acc, item) => acc + lineSubtotal(item), 0));
  return round2(Math.min(Math.max(0, orderDiscountAmount), linesTotal));
};

const newLineId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `line-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const buildLine = (product, quantity) => {
  const saleType = product.saleType || 'PIECE';
  return {
    lineId: newLineId(),
    productId: product.id,
    name: product.name,
    sku: product.sku,
    saleType,
    unitCode: product.unitCode || (saleType === 'WEIGHT' ? 'KG' : 'PCS'),
    unitLabel: saleType === 'WEIGHT' ? unitLabel(product.unitCode || 'KG') : 'pcs',
    costPrice: Number(product.costPrice ?? 0),
    unitPrice: Number(product.sellingPrice),
    taxRate: Number(product.taxRate ?? 12),
    maxStock: Number(product.stockQuantity ?? 0),
    quantity: roundQty(quantity),
    discountPercent: Number(product.defaultDiscountPercent ?? 0),
    discount: 0,
  };
};

const syncDiscountFromPercent = (item) => ({
  ...item,
  discount: lineDiscountAmount({ ...item, discount: 0 }),
});

/** Позиции для API: только построчные скидки (скидка на чек — отдельными полями в sales). */
export function buildCheckoutLineItems(items) {
  return items.map((i) => ({
    productId: i.productId,
    quantity: roundQty(i.quantity),
    discount: lineDiscountAmount(i),
    unitPrice: round2(i.unitPrice),
  }));
}

export const useCartStore = create((set, get) => ({
  items: [],
  orderDiscountAmount: 0,

  /** Штучный / услуга: +1, объединение строк по productId. */
  addPieceItem: (product, quantity = 1) => {
    const qty = roundQty(quantity);
    const { items } = get();
    const existing = items.find(
      (i) => i.productId === product.id && isPieceLikeProduct(i)
    );
    if (existing) {
      const next = syncDiscountFromPercent({
        ...existing,
        quantity: roundQty(existing.quantity + qty),
      });
      const nextItems = items.map((i) => (i.lineId === existing.lineId ? next : i));
      set({
        items: nextItems,
        orderDiscountAmount: capOrderDiscount(nextItems, get().orderDiscountAmount),
      });
      return next.lineId;
    }
    const line = syncDiscountFromPercent(buildLine(product, qty));
    const nextItems = [...items, line];
    set({
      items: nextItems,
      orderDiscountAmount: capOrderDiscount(nextItems, get().orderDiscountAmount),
    });
    return line.lineId;
  },

  /** Весовой: всегда отдельная строка. */
  addWeightLine: (product, quantityKg) => {
    const line = syncDiscountFromPercent(buildLine(product, quantityKg));
    const nextItems = [...get().items, line];
    set({
      items: nextItems,
      orderDiscountAmount: capOrderDiscount(nextItems, get().orderDiscountAmount),
    });
    return line.lineId;
  },

  addItem: (product, quantity = 1) => {
    if (product.saleType === 'WEIGHT') {
      return get().addWeightLine(product, quantity);
    }
    return get().addPieceItem(product, quantity);
  },

  updateQuantity: (lineId, quantity) => {
    const q = roundQty(quantity);
    if (q <= 0) {
      get().removeItem(lineId);
      return;
    }
    const nextItems = get().items.map((i) => {
      if (i.lineId !== lineId) return i;
      const next = { ...i, quantity: q };
      if (isPieceLikeProduct(i)) {
        next.quantity = Math.max(1, Math.round(q));
      }
      return syncDiscountFromPercent(next);
    });
    set({
      items: nextItems,
      orderDiscountAmount: capOrderDiscount(nextItems, get().orderDiscountAmount),
    });
  },

  updateUnitPrice: (lineId, unitPrice) => {
    const price = Math.max(0, round2(unitPrice));
    const nextItems = get().items.map((i) =>
      i.lineId === lineId ? syncDiscountFromPercent({ ...i, unitPrice: price }) : i
    );
    set({
      items: nextItems,
      orderDiscountAmount: capOrderDiscount(nextItems, get().orderDiscountAmount),
    });
  },

  updateDiscountPercent: (lineId, discountPercent) => {
    const pct = Math.max(0, Math.min(100, round2(discountPercent)));
    const nextItems = get().items.map((i) =>
      i.lineId === lineId ? syncDiscountFromPercent({ ...i, discountPercent: pct }) : i
    );
    set({
      items: nextItems,
      orderDiscountAmount: capOrderDiscount(nextItems, get().orderDiscountAmount),
    });
  },

  removeItem: (lineId) => {
    const nextItems = get().items.filter((i) => i.lineId !== lineId);
    set({
      items: nextItems,
      orderDiscountAmount: capOrderDiscount(nextItems, get().orderDiscountAmount),
    });
  },

  clearCart: () => set({ items: [], orderDiscountAmount: 0 }),

  getLinesTotal: () =>
    round2(get().items.reduce((acc, item) => acc + lineSubtotal(item), 0)),

  getOrderDiscount: () => capOrderDiscount(get().items, get().orderDiscountAmount),

  setOrderDiscountAmount: (amount) => {
    set({ orderDiscountAmount: capOrderDiscount(get().items, amount) });
  },

  setOrderDiscountPercent: (discountPercent) => {
    const pct = Math.max(0, Math.min(100, round2(discountPercent)));
    const linesTotal = get().getLinesTotal();
    set({ orderDiscountAmount: capOrderDiscount(get().items, round2(linesTotal * (pct / 100))) });
  },

  clearOrderDiscount: () => set({ orderDiscountAmount: 0 }),

  getCheckoutLineItems: () => buildCheckoutLineItems(get().items),

  getCheckoutOrderDiscountAmount: () => get().getOrderDiscount(),

  getCheckoutOrderDiscountPercent: () => {
    const linesTotal = get().getLinesTotal();
    const orderDisc = get().getOrderDiscount();
    if (orderDisc <= 0 || linesTotal <= 0) return 0;
    return round2((orderDisc / linesTotal) * 100);
  },

  getSubtotal: () =>
    get().items.reduce(
      (acc, item) => acc + netFromInclusive(lineSubtotal(item), item.taxRate),
      0
    ),

  getTaxTotal: () =>
    get().items.reduce(
      (acc, item) => acc + extractVatFromInclusive(lineSubtotal(item), item.taxRate),
      0
    ),

  getLineDiscountTotal: () =>
    round2(get().items.reduce((acc, item) => acc + lineDiscountAmount(item), 0)),

  getDiscountTotal: () => round2(get().getLineDiscountTotal() + get().getOrderDiscount()),

  getTotal: () => round2(get().getLinesTotal() - get().getOrderDiscount()),
}));
