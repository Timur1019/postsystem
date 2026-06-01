import { usePrintSettingsStore, PRINT_SETTINGS_DEFAULTS } from '../store/printSettingsStore';
import { syncPrintCssVars } from './syncPrintCssVars';

let suppressPrintDirty = false;

export function withSuppressPrintDirty(fn) {
  suppressPrintDirty = true;
  try {
    fn();
  } finally {
    suppressPrintDirty = false;
  }
}

export function isPrintDirtySuppressed() {
  return suppressPrintDirty;
}

export function printSettingsToPayload(state) {
  const s = state ?? usePrintSettingsStore.getState();
  return {
    paperWidthMm: s.paperWidthMm,
    contentWidthMm: s.contentWidthMm,
    pageMarginMm: s.pageMarginMm,
    padHorizontalMm: s.padHorizontalMm,
    padVerticalMm: s.padVerticalMm,
    fontSizePx: s.fontSizePx,
    lineHeight: s.lineHeight,
  };
}

export function applyPrintSettingsFromPayload(payload) {
  if (!payload || typeof payload !== 'object') return;
  withSuppressPrintDirty(() => {
    usePrintSettingsStore.setState({
      ...PRINT_SETTINGS_DEFAULTS,
      ...payload,
    });
    syncPrintCssVars(usePrintSettingsStore.getState());
  });
}
