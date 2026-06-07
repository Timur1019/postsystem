import {
  DEFAULT_LABEL_LAYOUT,
  DEFAULT_PRESET_ID,
  LABEL_PRINT_SETTINGS_KEY,
  effectiveLabelFontScale,
  findLabelPresetBySize,
  getLabelPresetById,
  layoutFromPreset,
} from './constants';

const LEGACY_LABEL_PRINT_SETTINGS_KEYS = [
  'aurent_label_print_settings_v1',
  'aurent_label_print_settings_v2',
  'aurent_label_print_settings_v3',
];

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
  root.style.setProperty('--label-font-scale', String(effectiveLabelFontScale(settings.fontScale)));
  root.style.setProperty('--label-pad-x', `${settings.padXmm ?? 6}mm`);
  root.style.setProperty('--label-pad-y', `${settings.padYmm ?? 10}mm`);
  root.style.setProperty('--label-rotate', settings.rotate180 ? '180deg' : '0deg');
  root.style.setProperty('--label-paper-w-mm', String(settings.paperWmm ?? 58));
  root.style.setProperty('--label-paper-h-mm', String(settings.paperHmm ?? 40));
  root.style.setProperty('--label-page-margin-mm', String(settings.pageMarginMm ?? 0));
  root.style.setProperty('--label-offset-x-mm', String(settings.offsetXmm ?? 0));
  root.style.setProperty('--label-offset-y-mm', String(settings.offsetYmm ?? 0));
}

/** @param {Record<string, unknown>} parsed @param {{ applyPresetDefaults?: boolean }} [opts] */
function normalizeSavedLayout(parsed, opts = {}) {
  const applyPresetDefaults = opts.applyPresetDefaults !== false;
  const preset =
    (typeof parsed.presetId === 'string' && getLabelPresetById(parsed.presetId)) ||
    findLabelPresetBySize(parsed.paperWmm, parsed.paperHmm) ||
    getLabelPresetById(DEFAULT_PRESET_ID);

  const base = preset ? layoutFromPreset(preset.id) : { ...DEFAULT_LABEL_LAYOUT };
  const use58x40 =
    preset?.id === 'standard_58_40' ||
    preset?.id === 'mp_wb_58_40' ||
    (Number(parsed.paperWmm) === 58 && Number(parsed.paperHmm) === 40);

  const fresh58 = use58x40 ? layoutFromPreset('standard_58_40') : null;

  return {
    presetId: preset?.id || base.presetId || DEFAULT_PRESET_ID,
    rotate180: applyPresetDefaults && fresh58 ? fresh58.rotate180 : Boolean(parsed.rotate180 ?? base.rotate180),
    fontScale: clampNum(parsed.fontScale ?? base.fontScale, 0.8, 1.6),
    padXmm: clampNum(applyPresetDefaults && fresh58 ? fresh58.padXmm : parsed.padXmm ?? base.padXmm, 0, 50),
    padYmm: clampNum(applyPresetDefaults && fresh58 ? fresh58.padYmm : parsed.padYmm ?? base.padYmm, 0, 70),
    offsetXmm: clampNum(
      applyPresetDefaults && fresh58 ? fresh58.offsetXmm : parsed.offsetXmm ?? base.offsetXmm ?? 0,
      -5,
      5
    ),
    offsetYmm: clampNum(
      applyPresetDefaults && fresh58 ? fresh58.offsetYmm : parsed.offsetYmm ?? base.offsetYmm ?? 0,
      -5,
      5
    ),
    paperWmm: preset?.paperWmm ?? 58,
    paperHmm: preset?.paperHmm ?? 40,
    pageMarginMm: clampNum(parsed.pageMarginMm ?? 0, 0, 10),
    layoutMode: 'manual',
  };
}

/** @returns {import('./constants').ShelfLabelLayoutSettings | null} */
export function loadSavedLabelLayout() {
  try {
    const rawCurrent = localStorage.getItem(LABEL_PRINT_SETTINGS_KEY);
    if (rawCurrent) {
      const parsed = JSON.parse(rawCurrent);
      if (parsed) return normalizeSavedLayout(parsed, { applyPresetDefaults: false });
    }

    for (const legacyKey of LEGACY_LABEL_PRINT_SETTINGS_KEYS) {
      const rawLegacy = localStorage.getItem(legacyKey);
      if (!rawLegacy) continue;
      const parsed = JSON.parse(rawLegacy);
      if (!parsed) continue;
      const migrated = normalizeSavedLayout(parsed, { applyPresetDefaults: true });
      saveLabelLayout(migrated);
      return migrated;
    }

    return null;
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
        offsetXmm: settings.offsetXmm,
        offsetYmm: settings.offsetYmm,
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
