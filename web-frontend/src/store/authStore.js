// src/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      _hasHydrated: false,

      setAuth: (token, user) => set({ token, user }),
      setToken: (token) => set({ token }),
      patchUser: (partial) =>
        set((state) => (state.user ? { user: { ...state.user, ...partial } } : {})),
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      logout: () => set({ token: null, user: null }),

      isAuthenticated: () => !!get().token,
      isAdmin: () => get().user?.role === 'ADMIN',
      isSuperAdmin: () => get().user?.role === 'SUPER_ADMIN',
      isManager: () => ['ADMIN', 'MANAGER'].includes(get().user?.role),
      isCashier: () => get().user?.role === 'CASHIER',
    }),
    {
      name: 'pos-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
      merge: (persisted, current) => {
        const saved = persisted ?? {};
        if (current.token) {
          return { ...current, token: current.token, user: current.user ?? saved.user };
        }
        return { ...current, ...saved };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
