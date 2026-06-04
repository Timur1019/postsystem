/** @typedef {'label'|'priceTag'} ShelfLabelVariant */
/** @typedef {'auto'|'manual'} ShelfLabelLayoutMode */

/** @typedef {object} ShelfLabelLayoutSettings
 * @property {boolean} rotate180
 * @property {number} fontScale
 * @property {number} padXmm
 * @property {number} padYmm
 * @property {number} paperWmm
 * @property {number} paperHmm
 * @property {number} pageMarginMm
 * @property {ShelfLabelLayoutMode} [layoutMode]
 */

export const LABEL_PRINT_SETTINGS_KEY = 'aurent_label_print_settings_v1';

/** @type {ShelfLabelLayoutSettings} */
export const DEFAULT_LABEL_LAYOUT = {
  rotate180: false,
  fontScale: 1,
  padXmm: 6,
  padYmm: 10,
  paperWmm: 58,
  paperHmm: 40,
  pageMarginMm: 0,
};

export const LABEL_SIZE_PRESETS = [
  { id: 'shelf58x40', label: 'Полка 58×40', paperWmm: 58, paperHmm: 40 },
  { id: 'shelf58x30', label: 'Полка 58×30', paperWmm: 58, paperHmm: 30 },
  { id: 'ean40x30', label: 'Штрихкод 40×30', paperWmm: 40, paperHmm: 30 },
  { id: 'ean50x30', label: 'Штрихкод 50×30', paperWmm: 50, paperHmm: 30 },
  { id: 'eanNominal', label: 'EAN номинал 37×26', paperWmm: 37.29, paperHmm: 25.93 },
  { id: 'small30x20', label: 'Мелкая 30×20', paperWmm: 30, paperHmm: 20 },
  { id: 'small43x25', label: 'Мелкая 43×25', paperWmm: 43, paperHmm: 25 },
  { id: 'mp75x120', label: 'Короб 75×120', paperWmm: 75, paperHmm: 120 },
  { id: 'mp100x150', label: 'Короб 100×150', paperWmm: 100, paperHmm: 150 },
];
