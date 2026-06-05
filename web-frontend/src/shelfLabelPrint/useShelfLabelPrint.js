import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { DEFAULT_LABEL_LAYOUT, findLabelPresetByLayout, layoutFromPreset } from './constants';
import { buildLabelPrintJob } from './buildLabelPrintJob';
import {
  applyLabelPrintCssVars,
  constrainLabelPads,
  getSafePadMaxMm,
  loadSavedLabelLayout,
  mergeLabelLayout,
  saveLabelLayout,
} from './labelLayoutUtils';
import { resolveAutoLabelLayout } from './resolveAutoLabelLayout';
import { printShelfLabel } from './printShelfLabel';

function toVariant(value) {
  return value === 'priceTag' ? 'priceTag' : 'label';
}

/**
 * Состояние модалки этикетки: контент, макет, payload для печати.
 */
export function useShelfLabelPrint({
  open,
  productName,
  barcode,
  price,
  autoLabelPrint = false,
  defaultVariant = 'label',
}) {
  const { t } = useTranslation();
  const defaultVar = toVariant(defaultVariant);

  const [variant, setVariant] = useState(defaultVar);
  const [showName, setShowName] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [copies, setCopies] = useState(1);
  const [layout, setLayout] = useState(DEFAULT_LABEL_LAYOUT);
  const [printing, setPrinting] = useState(false);

  const contentInput = useMemo(
    () => ({
      variant,
      showName,
      showBarcode,
      showPrice,
      productName,
      barcode,
      price,
    }),
    [variant, showName, showBarcode, showPrice, productName, barcode, price]
  );

  const autoLayout = useMemo(() => resolveAutoLabelLayout(contentInput), [contentInput]);

  const maxPadXmm = useMemo(() => getSafePadMaxMm(layout.paperWmm, 14, 50), [layout.paperWmm]);
  const maxPadYmm = useMemo(() => getSafePadMaxMm(layout.paperHmm, 14, 70), [layout.paperHmm]);

  const patchLayout = useCallback((patch) => {
    setLayout((prev) => mergeLabelLayout(prev, patch));
  }, []);

  const applyPreset = useCallback(
    (preset) => {
      patchLayout(
        layoutFromPreset(preset.id, {
          rotate180: layout.rotate180,
          pageMarginMm: layout.pageMarginMm,
        })
      );
    },
    [patchLayout, layout.rotate180, layout.pageMarginMm]
  );

  const activePreset = useMemo(() => findLabelPresetByLayout(layout), [layout]);

  useEffect(() => {
    if (!open) return;
    setVariant(defaultVar);
    setShowName(true);
    setShowBarcode(true);
    setShowPrice(true);
    setCopies(1);
    const initial = autoLabelPrint
      ? resolveAutoLabelLayout({
          variant: defaultVar,
          showName: true,
          showBarcode: true,
          showPrice: true,
          productName,
          barcode,
          price,
        })
      : loadSavedLabelLayout() || DEFAULT_LABEL_LAYOUT;
    setLayout(initial);
    applyLabelPrintCssVars(initial);
  }, [open, defaultVar, autoLabelPrint, productName, barcode, price]);

  useEffect(() => {
    if (!open || !autoLabelPrint) return;
    setLayout(autoLayout);
  }, [open, autoLabelPrint, autoLayout]);

  useEffect(() => {
    setLayout((s) => constrainLabelPads(s));
  }, [maxPadXmm, maxPadYmm]);

  useEffect(() => {
    if (!open) return;
    applyLabelPrintCssVars(layout);
    if (!autoLabelPrint) saveLabelLayout(layout);
  }, [open, layout, autoLabelPrint]);

  const currency = t('fiscalReceipt.currency');

  const printJob = useMemo(
    () =>
      buildLabelPrintJob({
        ...contentInput,
        copies,
        layout,
        layoutMode: autoLabelPrint ? 'auto' : 'manual',
        currency,
      }),
    [contentInput, copies, layout, autoLabelPrint, currency]
  );

  const sheetProps = useMemo(
    () => ({
      variant: printJob.variant,
      productName: printJob.productName,
      barcode: printJob.barcode,
      price: printJob.price,
      showName: printJob.showName,
      showBarcode: printJob.showBarcode,
      showPrice: printJob.showPrice,
      currency: printJob.currency,
      layoutKey: `${layout.paperWmm}x${layout.paperHmm}@${layout.fontScale}`,
    }),
    [printJob, layout.paperWmm, layout.paperHmm, layout.fontScale]
  );

  const setCopiesSafe = useCallback((value) => {
    const n = Number(value);
    setCopies(Math.min(999, Math.max(1, Number.isFinite(n) ? Math.trunc(n) : 1)));
  }, []);

  const tryPrint = useCallback(async () => {
    if (printing) return null;
    if (printJob.showBarcode && !printJob.barcode?.trim()) {
      toast.error(t('usersBarcodePrint.noBarcodeForPrint'));
      return null;
    }
    setPrinting(true);
    try {
      const result = await printShelfLabel(printJob, t);
      const name = result?.deviceName || '';
      toast.success(
        t('usersBarcodePrint.printSentTo', {
          defaultValue: 'Отправлено на принтер: {{name}}',
          name: name || t('desktop.labelPrinter', { defaultValue: 'Принтер штрих-кодов' }),
        }),
      );
      return printJob;
    } catch (err) {
      toast.error(err?.message || t('usersBarcodePrint.printFailed', { defaultValue: 'Не удалось напечатать.' }));
      return null;
    } finally {
      setPrinting(false);
    }
  }, [printJob, printing, t]);

  return {
    variant,
    setVariant,
    showName,
    setShowName,
    showBarcode,
    setShowBarcode,
    showPrice,
    setShowPrice,
    copies,
    setCopies: setCopiesSafe,
    bumpCopies: (delta) => setCopies((c) => Math.min(999, Math.max(1, c + delta))),
    layout,
    patchLayout,
    applyPreset,
    activePreset,
    maxPadXmm,
    maxPadYmm,
    autoLabelPrint,
    sheetProps,
    printJob,
    printing,
    tryPrint,
  };
}
