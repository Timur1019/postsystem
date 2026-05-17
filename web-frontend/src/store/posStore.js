// src/store/posStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const usePosStore = create(
  persist(
    (set) => ({
      storeId: null,
      setStoreId: (id) => set({ storeId: id }),
      clearStore: () => set({ storeId: null }),
    }),
    { name: 'pos-selected-store' }
  )
);
