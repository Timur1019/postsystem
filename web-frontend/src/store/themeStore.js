// src/store/themeStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Синхронизация с <html> и meta theme-color (и при клике, и после rehydrate). */
export function syncRootTheme(mode) {
  if (typeof document === 'undefined') return;
  const dark = mode === 'dark';
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', dark ? '#020617' : '#f1f5f9');
  }
}

/** 'dark' = ночь (как сейчас), 'light' = день / утро */
export const useThemeStore = create(
  persist(
    (set, get) => ({
      mode: 'dark',
      setMode: (mode) => {
        const m = mode === 'light' ? 'light' : 'dark';
        set({ mode: m });
        syncRootTheme(m);
      },
      toggleMode: () => {
        const m = get().mode === 'dark' ? 'light' : 'dark';
        set({ mode: m });
        syncRootTheme(m);
      },
    }),
    {
      name: 'pos-theme',
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        if (state?.mode === 'light' || state?.mode === 'dark') {
          syncRootTheme(state.mode);
        }
      },
    }
  )
);
