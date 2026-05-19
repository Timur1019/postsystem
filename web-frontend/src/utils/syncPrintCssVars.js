// src/utils/syncPrintCssVars.js
/** CSS-переменные для ширины/шрифта чека; размер листа @page подставляется в printWithHtmlClass на время печати. */
export function syncPrintCssVars(state) {
  if (typeof document === 'undefined') return;
  const s = state || {};
  const root = document.documentElement;

  const paper = Number(s.paperWidthMm) || 80;
  const content = Number(s.contentWidthMm) || 78;
  const pageM = Number(s.pageMarginMm) ?? 0;
  const padX = Number(s.padHorizontalMm) ?? 0;
  const padY = Number(s.padVerticalMm) ?? 1;
  const fontPx = Number(s.fontSizePx) || 13;
  const lh = Number(s.lineHeight) || 1.5;

  root.style.setProperty('--print-paper-w-mm', String(paper));
  root.style.setProperty('--print-paper-w', `${paper}mm`);
  root.style.setProperty('--print-content-w', `${content}mm`);
  root.style.setProperty('--print-page-margin-mm', `${pageM}mm`);
  root.style.setProperty('--print-pad-x', `${padX}mm`);
  root.style.setProperty('--print-pad-y', `${padY}mm`);
  root.style.setProperty('--print-font-px', `${fontPx}px`);
  root.style.setProperty('--print-line-height', String(lh));
}
