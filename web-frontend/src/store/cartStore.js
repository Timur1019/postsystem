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

/** Сумма закупа по строке (себестоимость × кол-во) */
export const lineCostTotal = (item) =>
  round2((Number(item.costPrice) || 0) * (Number(item.quantity) || 0));

const syncDiscountFromPercent = (item) => ({
  ...item,
  discount: lineDiscountAmount({ ...item, discount: 0 }),
});

export const useCartStore = create((set, get) => ({
  items: [],

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
      set({
        items: [...items, syncDiscountFromPercent(draft)],
      });
    }
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.productId === productId
          ? syncDiscountFromPercent({ ...i, quantity })
          : i
      ),
    });
  },

  updateUnitPrice: (productId, unitPrice) => {
    const price = Math.max(0, round2(unitPrice));
    set({
      items: get().items.map((i) =>
        i.productId === productId
          ? syncDiscountFromPercent({ ...i, unitPrice: price })
          : i
      ),
    });
  },

  updateLineSubtotal: (productId, subtotal) => {
    set({
      items: get().items.map((i) => {
        if (i.productId !== productId) return i;
        const gross = lineGross(i);
        const target = Math.max(0, Math.min(round2(subtotal), gross));
        const discount = round2(gross - target);
        const discountPercent = gross > 0 ? round2((discount / gross) * 100) : 0;
        return { ...i, discount, discountPercent };
      }),
    });
  },

  updateDiscountPercent: (productId, discountPercent) => {
    const pct = Math.max(0, Math.min(100, round2(discountPercent)));
    set({
      items: get().items.map((i) =>
        i.productId === productId
          ? syncDiscountFromPercent({ ...i, discountPercent: pct })
          : i
      ),
    });
  },

  removeItem: (productId) =>
    set({ items: get().items.filter((i) => i.productId !== productId) }),

  clearCart: () => set({ items: [] }),

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

  getDiscountTotal: () =>
    get().items.reduce((acc, item) => acc + lineDiscountAmount(item), 0),

  /** Итого к оплате (цена с учётом скидки, НДС внутри) */
  getTotal: () =>
    round2(get().items.reduce((acc, item) => acc + lineSubtotal(item), 0)),

  itemCount: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
}));
