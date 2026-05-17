// src/store/cartStore.js
import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],

  addItem: (product, quantity = 1) => {
    const { items } = get();
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      set({
        items: items.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        ),
      });
    } else {
      set({
        items: [
          ...items,
          {
            productId:   product.id,
            name:        product.name,
            sku:         product.sku,
            unitPrice:   product.sellingPrice,
            taxRate:     product.taxRate,
            maxStock:    product.stockQuantity,
            quantity,
            discount:    0,
          },
        ],
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
        i.productId === productId ? { ...i, quantity } : i
      ),
    });
  },

  updateDiscount: (productId, discount) =>
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, discount } : i
      ),
    }),

  removeItem: (productId) =>
    set({ items: get().items.filter((i) => i.productId !== productId) }),

  clearCart: () => set({ items: [] }),

  getSubtotal: () => {
    return get().items.reduce((acc, item) => {
      return acc + item.unitPrice * item.quantity - (item.discount || 0);
    }, 0);
  },

  getTaxTotal: () => {
    return get().items.reduce((acc, item) => {
      const taxable = item.unitPrice * item.quantity - (item.discount || 0);
      return acc + taxable * (item.taxRate / 100);
    }, 0);
  },

  getDiscountTotal: () =>
    get().items.reduce((acc, item) => acc + (item.discount || 0), 0),

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const tax      = get().getTaxTotal();
    return subtotal + tax;
  },

  itemCount: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
}));
