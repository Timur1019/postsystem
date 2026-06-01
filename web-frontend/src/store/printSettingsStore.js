// src/store/printSettingsStore.js
import { create } from 'zustand';
import { syncPrintCssVars } from '../utils/syncPrintCssVars';

/**
 * Касса / фискальный чек 80 мм: шире и чётче для термопринтера.
 */
export const PRINT_SETTINGS_DEFAULTS = {
  paperWidthMm: 80,
  contentWidthMm: 72,
  pageMarginMm: 0,
  padHorizontalMm: 3,
  padVerticalMm: 2,
  fontSizePx: 13,
  lineHeight: 1.5,
};

function clamp(n, min, max) {
  const x = Number(n);
  if (Number.isNaN(x)) return min;
  return Math.min(max, Math.max(min, x));
}

export const usePrintSettingsStore = create((set, get) => ({
      ...PRINT_SETTINGS_DEFAULTS,

      /** Быстрый выбор: подставляет типичные ширины под 58 / 80 мм */
      applyPaperPreset: (preset) => {
        if (preset === '58') {
          set({
            paperWidthMm: 58,
            contentWidthMm: 52,
            pageMarginMm: 0,
            padHorizontalMm: 2,
            padVerticalMm: 1,
            fontSizePx: 11,
            lineHeight: 1.4,
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
        set({ fontSizePx: clamp(v, 8, 18) });
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
}));

usePrintSettingsStore.subscribe(() => {
  syncPrintCssVars(usePrintSettingsStore.getState());
});
