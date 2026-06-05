export const SINGLE_LABEL_LOCK_STYLE_ID = 'pos-label-single-page-lock';

function parseMm(raw, fallback) {
  const n = parseFloat(String(raw ?? '').trim());
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Перед печатью: одна страница, фиксированная высота — иначе Chromium проматывает пустые листы. */
export function prepareSingleLabelPrintPage() {
  if (typeof document === 'undefined') return null;

  const layer = document.getElementById('shelf-label-print-layer');
  if (!layer) return null;

  const pages = [...layer.querySelectorAll('.shelflabel-print-page')];
  pages.slice(1).forEach((node) => node.remove());

  const page = layer.querySelector('.shelflabel-print-page');
  if (!page) return null;

  const root = document.documentElement;
  const widthMm = parseMm(root.style.getPropertyValue('--label-paper-w-mm'), 58);
  const pageHmm = parseMm(root.style.getPropertyValue('--label-paper-h-mm'), 40);

  document.getElementById(SINGLE_LABEL_LOCK_STYLE_ID)?.remove();
  const el = document.createElement('style');
  el.id = SINGLE_LABEL_LOCK_STYLE_ID;
  el.textContent = `
@page { size: ${widthMm}mm ${pageHmm}mm; margin: 0 !important; }
html, body {
  width: ${widthMm}mm !important;
  height: ${pageHmm}mm !important;
  max-width: ${widthMm}mm !important;
  max-height: ${pageHmm}mm !important;
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 !important;
}
#pos-label-print-mount, #shelf-label-print-layer {
  width: ${widthMm}mm !important;
  height: ${pageHmm}mm !important;
  max-width: ${widthMm}mm !important;
  max-height: ${pageHmm}mm !important;
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 !important;
}
.shelflabel-print-page {
  page-break-before: avoid !important;
  page-break-after: avoid !important;
  break-before: avoid !important;
  break-after: avoid !important;
}
`;
  document.head.appendChild(el);

  return { widthMm, pageHmm, pageCount: 1 };
}

export function removeSingleLabelPrintPageLock() {
  if (typeof document === 'undefined') return;
  document.getElementById(SINGLE_LABEL_LOCK_STYLE_ID)?.remove();
}
