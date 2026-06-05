/**
 * Печать этикетки / ценника.
 * Десктоп: сначала драйвер (HTML + printLabelPage) — XP-365B и аналоги не печатают сырой ESC/POS.
 * Запасной путь: ESC/POS (как чек / Z / X).
 */
import { ensureDesktopLabelPrinter } from '../services/cashierEscpos/ensureDesktopLabelPrinter';
import { printShelfLabelUnified } from '../services/cashierEscpos/printShelfLabelUnified';
import { applyLabelPrintCssVars } from './labelLayoutUtils';
import { mountLabelPrintLayer } from './mountLabelPrintLayer';
import { isDesktopLabelPrintAvailable, printShelfLabelSilent } from './printShelfLabelDriver';
import { teardownLabelPrintMount } from './labelPrintMount';

function sheetPropsFromJob(printJob) {
  return {
    variant: printJob.variant,
    productName: printJob.productName,
    barcode: printJob.barcode,
    price: printJob.price,
    showName: printJob.showName,
    showBarcode: printJob.showBarcode,
    showPrice: printJob.showPrice,
    currency: printJob.currency,
    layoutKey: `${printJob.paperWmm}x${printJob.paperHmm}@${printJob.fontScale}`,
  };
}

function layoutFromJob(printJob) {
  return {
    paperWmm: printJob.paperWmm,
    paperHmm: printJob.paperHmm,
    padXmm: printJob.padXmm,
    padYmm: printJob.padYmm,
    offsetXmm: printJob.offsetXmm,
    offsetYmm: printJob.offsetYmm,
    fontScale: printJob.fontScale,
    rotate180: printJob.rotate180,
    pageMarginMm: printJob.pageMarginMm,
  };
}

async function printViaDriver(printJob) {
  const sheetProps = sheetPropsFromJob(printJob);
  applyLabelPrintCssVars(layoutFromJob(printJob));

  const copies = Math.min(999, Math.max(1, Math.trunc(Number(printJob.copies) || 1)));
  const requireBarcode = printJob.showBarcode !== false;
  let root = null;

  try {
    let deviceName = '';
    for (let i = 0; i < copies; i += 1) {
      applyLabelPrintCssVars(layoutFromJob(printJob));
      root = mountLabelPrintLayer(sheetProps, 1);
      const result = await printShelfLabelSilent({ requireBarcode });
      deviceName = result?.deviceName || deviceName;
      try {
        root.unmount();
      } catch {
        /* ignore */
      }
      root = null;
      teardownLabelPrintMount();
      if (i < copies - 1) {
        await new Promise((r) => setTimeout(r, 450));
      }
    }
    return { mode: 'driver', deviceName };
  } finally {
    try {
      root?.unmount();
    } catch {
      /* ignore */
    }
    teardownLabelPrintMount();
  }
}

/**
 * @param {ReturnType<import('./buildLabelPrintJob').buildLabelPrintJob>} printJob
 * @param {Function} t
 */
export async function printShelfLabel(printJob, t) {
  const { deviceName: configuredPrinter } = await ensureDesktopLabelPrinter(t);
  applyLabelPrintCssVars(layoutFromJob(printJob));

  const result = await printShelfLabelUnified(printJob, t, {
    requireBarcode: printJob.showBarcode,
    preferDriverPrint: true,
    fallback: () => printViaDriver(printJob),
  });

  return {
    ...result,
    deviceName: result?.deviceName || configuredPrinter,
  };
}
