import { useLayoutEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export default function ShelfLabelBarcode({ value }) {
  const svgRef = useRef(null);

  useLayoutEffect(() => {
    const el = svgRef.current;
    if (!el || !value?.trim()) return;
    try {
      el.replaceChildren();
      const root = document.documentElement;
      const wMm = parseFloat(root.style.getPropertyValue('--label-paper-w-mm')) || 58;
      const hMm = parseFloat(root.style.getPropertyValue('--label-paper-h-mm')) || 40;
      const scale = parseFloat(root.style.getPropertyValue('--label-font-scale')) || 1;
      const isSmall = wMm <= 35 || hMm <= 25;
      JsBarcode(el, value.replace(/\s/g, ''), {
        format: 'CODE128',
        displayValue: true,
        fontSize: Math.max(7, Math.round((isSmall ? 8 : 11) * scale)),
        fontOptions: 'bold',
        height: Math.max(18, Math.round((isSmall ? 28 : 48) * scale)),
        margin: Math.max(1, Math.round((isSmall ? 2 : 4) * scale)),
        width: isSmall ? 1.35 : 2,
      });
    } catch {
      /* ignore */
    }
  }, [value]);

  if (!value?.trim()) return <p className="text-xs text-slate-400">—</p>;
  return <svg ref={svgRef} className="shelflabel-barcode-svg max-w-full" />;
}
