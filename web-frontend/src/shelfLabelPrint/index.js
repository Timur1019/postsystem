/**
 * Печать этикеток / ценников (admin).
 *
 * Стандарт:
 * 1. UI — ShelfLabelPrintModal (+ useShelfLabelPrint).
 * 2. Данные для печати — buildLabelPrintJob(printJob).
 * 3. Макет — resolveAutoLabelLayout (auto) или layout из localStorage (manual).
 * 4. Печать: printShelfLabel(printJob, t) → ESC/POS (как чек / Z / X).
 */
export { default as ShelfLabelPrintModal } from './ShelfLabelPrintModal';
export { printShelfLabel } from './printShelfLabel';
export { default as ShelfLabelSheet } from './ShelfLabelSheet';
export { useShelfLabelPrint } from './useShelfLabelPrint';
export { buildLabelPrintJob } from './buildLabelPrintJob';
export { resolveAutoLabelLayout } from './resolveAutoLabelLayout';
export { applyLabelPrintCssVars, loadSavedLabelLayout } from './labelLayoutUtils';
export { LABEL_SIZE_PRESETS, DEFAULT_LABEL_LAYOUT } from './constants';
