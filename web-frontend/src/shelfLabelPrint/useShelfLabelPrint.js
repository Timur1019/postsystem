import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { DEFAULT_LABEL_LAYOUT } from './constants';
import { buildLabelPrintJob } from './buildLabelPrintJob';
import { applyLabelPrintCssVars } from './labelLayoutUtils';
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
  layoutSettings,
}) {
  const { t } = useTranslation();
  const defaultVar = toVariant(defaultVariant);

  if (!layoutSettings) {
    throw new Error('useShelfLabelPrint: layoutSettings is required (use useLabelPrintLayoutSettings on the page)');
  }

  const [variant, setVariant] = useState(defaultVar);
  const [showName, setShowName] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [copies, setCopies] = useState(1);
  const [autoSizeEnabled, setAutoSizeEnabled] = useState(autoLabelPrint);
  const [printing, setPrinting] = useState(false);

  const {
    layout,
    patchLayout,
    applyPreset,
    resetPresetDefaults,
    activePreset,
    maxPadXmm,
    maxPadYmm,
  } = layoutSettings;

  const [autoLayout, setAutoLayout] = useState(DEFAULT_LABEL_LAYOUT);

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

  const effectiveLayout = autoSizeEnabled ? autoLayout : layout;

  useEffect(() => {
    if (!open) return;
    setVariant(defaultVar);
    setShowName(true);
    setShowBarcode(true);
    setShowPrice(true);
    setCopies(1);
    setAutoSizeEnabled(autoLabelPrint);
    setAutoLayout(
      resolveAutoLabelLayout({
        variant: defaultVar,
        showName: true,
        showBarcode: true,
        showPrice: true,
        productName,
        barcode,
        price,
      })
    );
  }, [open, defaultVar, autoLabelPrint, productName, barcode, price]);

  useEffect(() => {
    if (!open || !autoSizeEnabled) return;
    setAutoLayout(resolveAutoLabelLayout(contentInput));
  }, [open, autoSizeEnabled, contentInput]);

  useEffect(() => {
    if (!open) return;
    applyLabelPrintCssVars(effectiveLayout);
  }, [open, effectiveLayout]);

  const setAutoSizeEnabledSafe = useCallback((next) => {
    setAutoSizeEnabled(next);
    if (next) {
      setAutoLayout(resolveAutoLabelLayout(contentInput));
    }
  }, [contentInput]);

  const currency = t('fiscalReceipt.currency');

  const printJob = useMemo(
    () =>
      buildLabelPrintJob({
        ...contentInput,
        copies,
        layout: effectiveLayout,
        layoutMode: autoSizeEnabled ? 'auto' : 'manual',
        currency,
      }),
    [contentInput, copies, effectiveLayout, autoSizeEnabled, currency]
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
      layoutKey: `${effectiveLayout.paperWmm}x${effectiveLayout.paperHmm}@${effectiveLayout.fontScale}`,
    }),
    [printJob, effectiveLayout.paperWmm, effectiveLayout.paperHmm, effectiveLayout.fontScale]
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
    layout: effectiveLayout,
    patchLayout,
    applyPreset,
    resetPresetDefaults,
    activePreset,
    maxPadXmm,
    maxPadYmm,
    autoSizeEnabled,
    setAutoSizeEnabled: setAutoSizeEnabledSafe,
    sheetProps,
    printJob,
    printing,
    tryPrint,
  };
}
