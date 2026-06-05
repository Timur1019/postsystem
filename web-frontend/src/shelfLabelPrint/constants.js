/** @typedef {'label'|'priceTag'} ShelfLabelVariant */
/** @typedef {'auto'|'manual'} ShelfLabelLayoutMode */
/** @typedef {'micro'|'standard'|'large'|'marketplace'} LabelSizeCategory */

/**
 * @typedef {object} LabelSizePreset
 * @property {string} id
 * @property {LabelSizeCategory} category
 * @property {number} paperWmm
 * @property {number} paperHmm
 * @property {string} profileId — имя профиля бумаги в Windows (должно совпадать)
 * @property {number} padXmm
 * @property {number} padYmm
 * @property {number} fontScale
 * @property {string} i18nKey
 * @property {number} [offsetXmm] — калибровка вправо (+)
 * @property {number} [offsetYmm] — калибровка вверх (+)
 * @property {boolean} [rotate180] — поворот для термопринтера при отрыве
 * @property {boolean} [widePrinterOnly] — шире 82 мм (XP-365B не поддерживает)
 */

/** @typedef {object} ShelfLabelLayoutSettings
 * @property {string} [presetId]
 * @property {boolean} rotate180
 * @property {number} fontScale
 * @property {number} padXmm
 * @property {number} padYmm
 * @property {number} offsetXmm
 * @property {number} offsetYmm
 * @property {number} paperWmm
 * @property {number} paperHmm
 * @property {number} pageMarginMm
 * @property {ShelfLabelLayoutMode} [layoutMode]
 */

/** Макс. ширина печати XP-365B и аналогов (мм). */
export const LABEL_PRINTER_STANDARD_MAX_WIDTH_MM = 82;

export const DEFAULT_PRESET_ID = 'standard_58_40';

export const LABEL_PRINT_SETTINGS_KEY = 'aurent_label_print_settings_v3';

export const LABEL_SIZE_CATEGORIES = [
  { id: 'micro', i18nKey: 'usersBarcodePrint.sizeCategory.micro' },
  { id: 'standard', i18nKey: 'usersBarcodePrint.sizeCategory.standard' },
  { id: 'large', i18nKey: 'usersBarcodePrint.sizeCategory.large' },
  { id: 'marketplace', i18nKey: 'usersBarcodePrint.sizeCategory.marketplace' },
];

/** Только реальные рулоны СНГ — без произвольных размеров. */
export const LABEL_SIZE_PRESETS = [
  {
    id: 'micro_30_20',
    category: 'micro',
    paperWmm: 30,
    paperHmm: 20,
    profileId: '30x20',
    padXmm: 1.5,
    padYmm: 1.5,
    fontScale: 1.05,
    i18nKey: 'usersBarcodePrint.sizePreset.micro_30_20',
  },
  {
    id: 'micro_43_25',
    category: 'micro',
    paperWmm: 43,
    paperHmm: 25,
    profileId: '43x25',
    padXmm: 2,
    padYmm: 2,
    fontScale: 1,
    i18nKey: 'usersBarcodePrint.sizePreset.micro_43_25',
  },
  {
    id: 'micro_47_25',
    category: 'micro',
    paperWmm: 47,
    paperHmm: 25,
    profileId: '47x25',
    padXmm: 2,
    padYmm: 2,
    fontScale: 0.98,
    i18nKey: 'usersBarcodePrint.sizePreset.micro_47_25',
  },
  {
    id: 'ean_nominal',
    category: 'micro',
    paperWmm: 37.29,
    paperHmm: 25.93,
    profileId: '37x26',
    padXmm: 2,
    padYmm: 2,
    fontScale: 1,
    i18nKey: 'usersBarcodePrint.sizePreset.ean_nominal',
  },
  {
    id: 'standard_50_40',
    category: 'standard',
    paperWmm: 50,
    paperHmm: 40,
    profileId: '50x40',
    padXmm: 2.5,
    padYmm: 2.5,
    fontScale: 1,
    offsetXmm: 1,
    offsetYmm: 0.8,
    i18nKey: 'usersBarcodePrint.sizePreset.standard_50_40',
  },
  {
    id: 'standard_58_30',
    category: 'standard',
    paperWmm: 58,
    paperHmm: 30,
    profileId: '58x30',
    padXmm: 2.5,
    padYmm: 2.5,
    fontScale: 1,
    offsetXmm: 0.8,
    offsetYmm: 0.5,
    i18nKey: 'usersBarcodePrint.sizePreset.standard_58_30',
  },
  {
    id: 'standard_58_40',
    category: 'standard',
    paperWmm: 58,
    paperHmm: 40,
    profileId: '58x40',
    padXmm: 2.5,
    padYmm: 2.5,
    fontScale: 1,
    offsetXmm: 2.5,
    offsetYmm: 1.5,
    rotate180: true,
    i18nKey: 'usersBarcodePrint.sizePreset.standard_58_40',
  },
  {
    id: 'standard_58_60',
    category: 'standard',
    paperWmm: 58,
    paperHmm: 60,
    profileId: '58x60',
    padXmm: 3,
    padYmm: 3,
    fontScale: 0.95,
    i18nKey: 'usersBarcodePrint.sizePreset.standard_58_60',
  },
  {
    id: 'large_74_45',
    category: 'large',
    paperWmm: 74,
    paperHmm: 45,
    profileId: '74x45',
    padXmm: 3,
    padYmm: 3,
    fontScale: 0.95,
    i18nKey: 'usersBarcodePrint.sizePreset.large_74_45',
  },
  {
    id: 'large_80_80',
    category: 'large',
    paperWmm: 80,
    paperHmm: 80,
    profileId: '80x80',
    padXmm: 4,
    padYmm: 4,
    fontScale: 0.9,
    i18nKey: 'usersBarcodePrint.sizePreset.large_80_80',
  },
  {
    id: 'mp_ozon_75_120',
    category: 'marketplace',
    paperWmm: 75,
    paperHmm: 120,
    profileId: '75x120',
    padXmm: 4,
    padYmm: 4,
    fontScale: 0.88,
    i18nKey: 'usersBarcodePrint.sizePreset.mp_ozon_75_120',
  },
  {
    id: 'mp_wb_58_40',
    category: 'marketplace',
    paperWmm: 58,
    paperHmm: 40,
    profileId: '58x40',
    padXmm: 2.5,
    padYmm: 2.5,
    fontScale: 1,
    offsetXmm: 2.5,
    offsetYmm: 1.5,
    rotate180: true,
    i18nKey: 'usersBarcodePrint.sizePreset.mp_wb_58_40',
  },
  {
    id: 'mp_wide_100_150',
    category: 'marketplace',
    paperWmm: 100,
    paperHmm: 150,
    profileId: '100x150',
    padXmm: 5,
    padYmm: 5,
    fontScale: 0.85,
    widePrinterOnly: true,
    i18nKey: 'usersBarcodePrint.sizePreset.mp_wide_100_150',
  },
];

/** @param {string} id */
export function getLabelPresetById(id) {
  return LABEL_SIZE_PRESETS.find((p) => p.id === id) || null;
}

/** @param {number} w @param {number} h */
export function findLabelPresetBySize(w, h) {
  const ww = Number(w);
  const hh = Number(h);
  return (
    LABEL_SIZE_PRESETS.find((p) => p.paperWmm === ww && p.paperHmm === hh) ||
    LABEL_SIZE_PRESETS.find(
      (p) => Math.abs(p.paperWmm - ww) < 0.5 && Math.abs(p.paperHmm - hh) < 0.5
    ) ||
    null
  );
}

/** @param {Partial<ShelfLabelLayoutSettings>} layout */
export function findLabelPresetByLayout(layout) {
  if (layout?.presetId) {
    const byId = getLabelPresetById(layout.presetId);
    if (byId) return byId;
  }
  return findLabelPresetBySize(layout?.paperWmm, layout?.paperHmm);
}

/** @param {string} presetId @param {Partial<ShelfLabelLayoutSettings>} [overrides] */
export function layoutFromPreset(presetId, overrides = {}) {
  const preset = getLabelPresetById(presetId) || getLabelPresetById(DEFAULT_PRESET_ID);
  return {
    presetId: preset.id,
    paperWmm: preset.paperWmm,
    paperHmm: preset.paperHmm,
    padXmm: preset.padXmm,
    padYmm: preset.padYmm,
    offsetXmm: preset.offsetXmm ?? 0,
    offsetYmm: preset.offsetYmm ?? 0,
    fontScale: preset.fontScale,
    rotate180: Boolean(preset.rotate180),
    pageMarginMm: 0,
    layoutMode: 'manual',
    ...overrides,
  };
}

/** @param {LabelSizePreset} preset */
export function isWidePrinterPreset(preset) {
  return Boolean(preset?.widePrinterOnly) || Number(preset?.paperWmm) > LABEL_PRINTER_STANDARD_MAX_WIDTH_MM;
}

/** @type {ShelfLabelLayoutSettings} */
export const DEFAULT_LABEL_LAYOUT = layoutFromPreset(DEFAULT_PRESET_ID);
