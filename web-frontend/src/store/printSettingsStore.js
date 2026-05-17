// src/store/printSettingsStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { syncPrintCssVars } from '../utils/syncPrintCssVars';

/** Значения по умолчанию под ленту 80 мм */
export const PRINT_SETTINGS_DEFAULTS = {
  paperWidthMm: 80,
  contentWidthMm: 72,
  pageMarginMm: 2,
  padHorizontalMm: 2,
  padVerticalMm: 3,
  fontSizePx: 10,
  lineHeight: 1.35,
};

function clamp(n, min, max) {
  const x = Number(n);
  if (Number.isNaN(x)) return min;
  return Math.min(max, Math.max(min, x));
}

export const usePrintSettingsStore = create(
  persist(
    (set, get) => ({
      ...PRINT_SETTINGS_DEFAULTS,

      /** Быстрый выбор: подставляет типичные ширины под 58 / 80 мм */
      applyPaperPreset: (preset) => {
        if (preset === '58') {
          set({
            paperWidthMm: 58,
            contentWidthMm: 48,
            pageMarginMm: 2,
            padHorizontalMm: 1.5,
            padVerticalMm: 2.5,
            fontSizePx: 9,
            lineHeight: 1.35,
          });
        } else {
          set({ ...PRINT_SETTINGS_DEFAULTS });
        }
        queueMicrotask(() => syncPrintCssVars(get()));
      },

      setPaperWidthMm: (v) => {
        set({ paperWidthMm: clamp(v, 40, 120) });
        queueMicrotask(() => syncPrintCssVars(get()));
      },
      setContentWidthMm: (v) => {
        set({ contentWidthMm: clamp(v, 36, 110) });
        queueMicrotask(() => syncPrintCssVars(get()));
      },
      setPageMarginMm: (v) => {
        set({ pageMarginMm: clamp(v, 0, 12) });
        queueMicrotask(() => syncPrintCssVars(get()));
      },
      setPadHorizontalMm: (v) => {
        set({ padHorizontalMm: clamp(v, 0, 8) });
        queueMicrotask(() => syncPrintCssVars(get()));
      },
      setPadVerticalMm: (v) => {
        set({ padVerticalMm: clamp(v, 0, 12) });
        queueMicrotask(() => syncPrintCssVars(get()));
      },
      setFontSizePx: (v) => {
        set({ fontSizePx: clamp(v, 7, 16) });
        queueMicrotask(() => syncPrintCssVars(get()));
      },
      setLineHeight: (v) => {
        set({ lineHeight: clamp(v, 1.05, 1.8) });
        queueMicrotask(() => syncPrintCssVars(get()));
      },

      resetToDefaults: () => {
        set({ ...PRINT_SETTINGS_DEFAULTS });
        queueMicrotask(() => syncPrintCssVars(get()));
      },
    }),
    {
      name: 'pos-print-settings',
      partialize: (s) => ({
        paperWidthMm: s.paperWidthMm,
        contentWidthMm: s.contentWidthMm,
        pageMarginMm: s.pageMarginMm,
        padHorizontalMm: s.padHorizontalMm,
        padVerticalMm: s.padVerticalMm,
        fontSizePx: s.fontSizePx,
        lineHeight: s.lineHeight,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) syncPrintCssVars(state);
      },
    }
  )
);

usePrintSettingsStore.subscribe(() => {
  syncPrintCssVars(usePrintSettingsStore.getState());
});
