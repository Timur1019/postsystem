import {
  DEFAULT_LABEL_LAYOUT,
  DEFAULT_PRESET_ID,
  LABEL_PRINT_SETTINGS_KEY,
  findLabelPresetBySize,
  getLabelPresetById,
  layoutFromPreset,
} from './constants';

const LEGACY_LABEL_PRINT_SETTINGS_KEY = 'aurent_label_print_settings_v1';

export const clampNum = (v, min, max) => {
  const raw = String(v ?? '').trim().replace(',', '.');
  const n = Number(raw);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
};

export const snapStep = (n, step) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  const s = Number(step) || 1;
  return Math.round(x / s) * s;
};

export function getSafePadMaxMm(paperMm, minContentMm = 14, absMaxMm = 50) {
  const p = Number(paperMm);
  if (!Number.isFinite(p) || p <= 0) return 0;
  const raw = Math.max(0, (p - minContentMm) / 2);
  return snapStep(Math.min(absMaxMm, raw), 0.5);
}

/** @param {import('./constants').ShelfLabelLayoutSettings} settings */
export function applyLabelPrintCssVars(settings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--label-font-scale', String(settings.fontScale ?? 1));
  root.style.setProperty('--label-pad-x', `${settings.padXmm ?? 6}mm`);
  root.style.setProperty('--label-pad-y', `${settings.padYmm ?? 10}mm`);
  root.style.setProperty('--label-rotate', settings.rotate180 ? '180deg' : '0deg');
  root.style.setProperty('--label-paper-w-mm', String(settings.paperWmm ?? 58));
  root.style.setProperty('--label-paper-h-mm', String(settings.paperHmm ?? 40));
  root.style.setProperty('--label-page-margin-mm', String(settings.pageMarginMm ?? 0));
}

/** @param {Record<string, unknown>} parsed */
function normalizeSavedLayout(parsed) {
  const preset =
    (typeof parsed.presetId === 'string' && getLabelPresetById(parsed.presetId)) ||
    findLabelPresetBySize(parsed.paperWmm, parsed.paperHmm);

  const base = preset ? layoutFromPreset(preset.id) : { ...DEFAULT_LABEL_LAYOUT };

  return {
    presetId: preset?.id || base.presetId || DEFAULT_PRESET_ID,
    rotate180: Boolean(parsed.rotate180),
    fontScale: clampNum(parsed.fontScale, 0.8, 1.6),
    padXmm: clampNum(parsed.padXmm, 0, 50),
    padYmm: clampNum(parsed.padYmm, 0, 70),
    paperWmm: preset?.paperWmm ?? clampNum(parsed.paperWmm, 30, 120),
    paperHmm: preset?.paperHmm ?? clampNum(parsed.paperHmm, 20, 150),
    pageMarginMm: clampNum(parsed.pageMarginMm, 0, 10),
    layoutMode: 'manual',
  };
}

/** @returns {import('./constants').ShelfLabelLayoutSettings | null} */
export function loadSavedLabelLayout() {
  try {
    const rawV2 = localStorage.getItem(LABEL_PRINT_SETTINGS_KEY);
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      if (parsed) return normalizeSavedLayout(parsed);
    }

    const rawV1 = localStorage.getItem(LEGACY_LABEL_PRINT_SETTINGS_KEY);
    if (!rawV1) return null;

    const parsed = JSON.parse(rawV1);
    if (!parsed) return null;

    const migrated = normalizeSavedLayout(parsed);
    saveLabelLayout(migrated);
    return migrated;
  } catch {
    return null;
  }
}

/** @param {import('./constants').ShelfLabelLayoutSettings} settings */
export function saveLabelLayout(settings) {
  try {
    localStorage.setItem(
      LABEL_PRINT_SETTINGS_KEY,
      JSON.stringify({
        presetId: settings.presetId,
        rotate180: settings.rotate180,
        fontScale: settings.fontScale,
        padXmm: settings.padXmm,
        padYmm: settings.padYmm,
        paperWmm: settings.paperWmm,
        paperHmm: settings.paperHmm,
        pageMarginMm: settings.pageMarginMm,
      })
    );
  } catch {
    /* ignore */
  }
}

/** @param {import('./constants').ShelfLabelLayoutSettings} settings */
export function constrainLabelPads(settings) {
  const maxPadXmm = getSafePadMaxMm(settings.paperWmm, 14, 50);
  const maxPadYmm = getSafePadMaxMm(settings.paperHmm, 14, 70);
  const padXmm = snapStep(clampNum(settings.padXmm, 0, maxPadXmm), 0.5);
  const padYmm = snapStep(clampNum(settings.padYmm, 0, maxPadYmm), 0.5);
  if (padXmm === settings.padXmm && padYmm === settings.padYmm) return settings;
  return { ...settings, padXmm, padYmm };
}

/** @param {Partial<import('./constants').ShelfLabelLayoutSettings>} patch */
export function mergeLabelLayout(base, patch) {
  return constrainLabelPads({ ...DEFAULT_LABEL_LAYOUT, ...base, ...patch });
}
