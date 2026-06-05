import { createRoot } from 'react-dom/client';
import { getLabelPrintMountEl } from './labelPrintMount';
import ShelfLabelSheet from './ShelfLabelSheet';

/**
 * Монтирует слой этикеток для тихой печати через драйвер (printLabelPage).
 * @param {object} sheetProps — пропсы ShelfLabelSheet
 * @param {number} copies
 */
export function mountLabelPrintLayer(sheetProps, copies = 1) {
  const host = getLabelPrintMountEl();
  host.replaceChildren();
  const layer = document.createElement('div');
  layer.id = 'shelf-label-print-layer';
  layer.className = 'shelflabel-print-layer';
  host.appendChild(layer);
  const root = createRoot(layer);
  const count = Math.min(999, Math.max(1, Math.trunc(Number(copies) || 1)));
  const pages = Array.from({ length: count }, (_, i) => (
    <div key={i} className="shelflabel-print-page">
      <ShelfLabelSheet {...sheetProps} />
    </div>
  ));
  root.render(<>{pages}</>);
  return root;
}
