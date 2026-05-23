// src/store/cartStore.js
import { create } from 'zustand';
import { extractVatFromInclusive, netFromInclusive, round2 } from '../utils/taxAmounts';

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

/** Позиции для API: только построчные скидки (скидка на чек — отдельными полями в sales). */
export function buildCheckoutLineItems(items) {
  return items.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
    discount: lineDiscountAmount(i),
    unitPrice: round2(i.unitPrice),
  }));
}

const syncDiscountFromPercent = (item) => ({
  ...item,
  discount: lineDiscountAmount({ ...item, discount: 0 }),
});

export const useCartStore = create((set, get) => ({
  items: [],
  /** Общая скидка на чек (от суммы после скидок по строкам). */
  orderDiscountAmount: 0,

  addItem: (product, quantity = 1) => {
    const { items } = get();
    const unitPrice = Number(product.sellingPrice);
    const discountPercent = Number(product.defaultDiscountPercent ?? 0);
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      const next = {
        ...existing,
        quantity: existing.quantity + quantity,
      };
      set({
        items: items.map((i) =>
          i.productId === product.id ? syncDiscountFromPercent(next) : i
        ),
        orderDiscountAmount: capOrderDiscount(
          items.map((i) => (i.productId === product.id ? syncDiscountFromPercent(next) : i)),
          get().orderDiscountAmount
        ),
      });
    } else {
      const draft = {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        costPrice: Number(product.costPrice ?? 0),
        unitPrice,
        taxRate: Number(product.taxRate ?? 12),
        maxStock: product.stockQuantity,
        quantity,
        discountPercent,
        discount: 0,
      };
      const nextItems = [...items, syncDiscountFromPercent(draft)];
      set({
        items: nextItems,
        orderDiscountAmount: capOrderDiscount(nextItems, get().orderDiscountAmount),
      });
    }
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const nextItems = get().items.map((i) =>
      i.productId === productId ? syncDiscountFromPercent({ ...i, quantity }) : i
    );
    set({
      items: nextItems,
      orderDiscountAmount: capOrderDiscount(nextItems, get().orderDiscountAmount),
    });
  },

  updateUnitPrice: (productId, unitPrice) => {
    const price = Math.max(0, round2(unitPrice));
    const nextItems = get().items.map((i) =>
      i.productId === productId ? syncDiscountFromPercent({ ...i, unitPrice: price }) : i
    );
    set({
      items: nextItems,
      orderDiscountAmount: capOrderDiscount(nextItems, get().orderDiscountAmount),
    });
  },

  updateDiscountPercent: (productId, discountPercent) => {
    const pct = Math.max(0, Math.min(100, round2(discountPercent)));
    const nextItems = get().items.map((i) =>
      i.productId === productId ? syncDiscountFromPercent({ ...i, discountPercent: pct }) : i
    );
    set({
      items: nextItems,
      orderDiscountAmount: capOrderDiscount(nextItems, get().orderDiscountAmount),
    });
  },

  removeItem: (productId) => {
    const nextItems = get().items.filter((i) => i.productId !== productId);
    set({
      items: nextItems,
      orderDiscountAmount: capOrderDiscount(nextItems, get().orderDiscountAmount),
    });
  },

  clearCart: () => set({ items: [], orderDiscountAmount: 0 }),

  /** Сумма чека до общей скидки (после скидок по строкам). */
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

  /** Сумма без НДС (нетто) */
  getSubtotal: () =>
    get().items.reduce(
      (acc, item) => acc + netFromInclusive(lineSubtotal(item), item.taxRate),
      0
    ),

  /** НДС, уже включённый в цену */
  getTaxTotal: () =>
    get().items.reduce(
      (acc, item) => acc + extractVatFromInclusive(lineSubtotal(item), item.taxRate),
      0
    ),

  getLineDiscountTotal: () =>
    round2(get().items.reduce((acc, item) => acc + lineDiscountAmount(item), 0)),

  getDiscountTotal: () => round2(get().getLineDiscountTotal() + get().getOrderDiscount()),

  /** Итого к оплате (цена с учётом скидки, НДС внутри) */
  getTotal: () => round2(get().getLinesTotal() - get().getOrderDiscount()),
}));
