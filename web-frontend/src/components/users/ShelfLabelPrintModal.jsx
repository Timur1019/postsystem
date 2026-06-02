import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Printer, Settings2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import JsBarcode from 'jsbarcode';
import { fmtMoney } from '../../utils/formatMoney';
import { getLabelPrintMountEl, teardownLabelPrintMount } from '../../utils/labelPrintMount';
import {
  isDesktopLabelPrintAvailable,
  printShelfLabelSilent,
} from '../../utils/printShelfLabel';

import '../../styles/shelf-label-print.css';

const LABEL_PRINT_SETTINGS_KEY = 'aurent_label_print_settings_v1';

const clampNum = (v, min, max) => {
  const raw = String(v ?? '').trim().replace(',', '.');
  const n = Number(raw);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
};

const snapStep = (n, step) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  const s = Number(step) || 1;
  return Math.round(x / s) * s;
};

function applyLabelPrintCssVars(settings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--label-font-scale', String(settings.fontScale ?? 1));
  root.style.setProperty('--label-pad-x', `${settings.padXmm ?? 6}mm`);
  root.style.setProperty('--label-pad-y', `${settings.padYmm ?? 10}mm`);
  root.style.setProperty('--label-rotate', settings.rotate180 ? '180deg' : '0deg');
}

function BarcodeBlock({ value }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const el = svgRef.current;
    if (!el || !value?.trim()) return;
    try {
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }
      JsBarcode(el, value.replace(/\s/g, ''), {
        format: 'CODE128',
        displayValue: true,
        fontSize: 11,
        height: 48,
        margin: 4,
        width: 2,
      });
    } catch {
      /* ignore bad barcode */
    }
  }, [value]);

  if (!value?.trim()) {
    return <p className="text-xs text-slate-400">—</p>;
  }

  return <svg ref={svgRef} className="shelflabel-barcode-svg max-w-full" />;
}

function LabelSheet({
  variant,
  productName,
  barcode,
  price,
  showName,
  showBarcode,
  showPrice,
  currency,
}) {
  const isPriceTag = variant === 'priceTag';
  const hasPrice = price != null && !Number.isNaN(Number(price));
  return (
    <div className={`shelflabel-card ${isPriceTag ? 'shelflabel-card--pricetag' : 'shelflabel-card--label'} shelflabel-card--tone`}>
      {isPriceTag && showPrice && hasPrice && (
        <div className="shelflabel-price shelflabel-price--large">
          {fmtMoney(price)} {currency}
        </div>
      )}
      {showName && productName && <div className="shelflabel-name">{productName}</div>}
      {showBarcode && <BarcodeBlock value={barcode || ''} />}
      {!isPriceTag && showPrice && hasPrice && (
        <div className="shelflabel-price shelflabel-price--footer">
          {fmtMoney(price)} {currency}
        </div>
      )}
    </div>
  );
}

function mountLabelPrintLayer(printNodes) {
  const host = getLabelPrintMountEl();
  host.replaceChildren();
  const layer = document.createElement('div');
  layer.id = 'shelf-label-print-layer';
  layer.className = 'shelflabel-print-layer';
  host.appendChild(layer);
  const root = createRoot(layer);
  root.render(<>{printNodes}</>);
  return root;
}

/**
 * Этикетка / ценник для полки — предпросмотр и печать.
 */
export default function ShelfLabelPrintModal({
  open,
  onClose,
  productName,
  barcode,
  price,
}) {
  const { t, i18n } = useTranslation();
  const [variant, setVariant] = React.useState('label');
  const [showName, setShowName] = React.useState(true);
  const [showBarcode, setShowBarcode] = React.useState(true);
  const [showPrice, setShowPrice] = React.useState(true);
  const [copies, setCopies] = React.useState(1);
  const [labelPrinterName, setLabelPrinterName] = useState('');
  const [labelSettings, setLabelSettings] = useState({
    rotate180: false,
    fontScale: 1,
    padXmm: 6,
    padYmm: 10,
  });
  const printRootRef = useRef(null);

  const canPickLabelPrinter =
    typeof window !== 'undefined' && typeof window.desktopCashier?.openLabelPrinterPicker === 'function';

  const reloadLabelPrinter = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (typeof window.desktopCashier?.getPrinterSettings !== 'function') return;
    try {
      const settings = await window.desktopCashier.getPrinterSettings();
      setLabelPrinterName(String(settings?.labelPrinterName || '').trim());
    } catch {
      setLabelPrinterName('');
    }
  }, []);

  useEffect(() => {
    if (open) {
      setVariant('label');
      setShowName(true);
      setShowBarcode(true);
      setShowPrice(true);
      setCopies(1);
      void reloadLabelPrinter();
      try {
        const raw = localStorage.getItem(LABEL_PRINT_SETTINGS_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        const next = parsed
          ? {
              rotate180: Boolean(parsed.rotate180),
              fontScale: clampNum(parsed.fontScale, 0.8, 1.6),
              padXmm: clampNum(parsed.padXmm, 0, 50),
              padYmm: clampNum(parsed.padYmm, 0, 70),
            }
          : null;
        if (next) {
          setLabelSettings(next);
          applyLabelPrintCssVars(next);
        } else {
          applyLabelPrintCssVars(labelSettings);
        }
      } catch {
        applyLabelPrintCssVars(labelSettings);
      }
    }
    return () => {
      if (!open) {
        try {
          printRootRef.current?.unmount();
        } catch {
          /* ignore */
        }
        printRootRef.current = null;
        teardownLabelPrintMount();
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    applyLabelPrintCssVars(labelSettings);
    try {
      localStorage.setItem(LABEL_PRINT_SETTINGS_KEY, JSON.stringify(labelSettings));
    } catch {
      /* ignore */
    }
  }, [labelSettings, open]);

  const currency = t('fiscalReceipt.currency');

  const setCopiesClamped = useCallback((next) => {
    const n = Number(next);
    const clamped = Math.min(999, Math.max(1, Number.isFinite(n) ? Math.trunc(n) : 1));
    setCopies(clamped);
  }, []);

  const printNodes = useMemo(() => {
    const n = Math.min(999, Math.max(1, Number(copies) || 1));
    return Array.from({ length: n }, (_, i) => (
      <div key={i} className="shelflabel-print-page">
        <LabelSheet
          variant={variant}
          productName={productName}
          barcode={barcode}
          price={price}
          showName={showName}
          showBarcode={showBarcode}
          showPrice={showPrice}
          currency={currency}
        />
      </div>
    ));
  }, [variant, productName, barcode, price, showName, showBarcode, showPrice, currency, copies]);

  const doPrint = useCallback(async () => {
    if (showBarcode && !barcode?.trim()) {
      toast.error(t('usersBarcodePrint.noBarcodeForPrint'));
      return;
    }

    try {
      printRootRef.current?.unmount();
    } catch {
      /* ignore */
    }
    printRootRef.current = mountLabelPrintLayer(printNodes);

    try {
      const mode = await printShelfLabelSilent({ requireBarcode: showBarcode });
      if (mode === 'silent' || mode === 'dialog') {
        toast.success(t('usersBarcodePrint.printSent'));
      }
    } catch (e) {
      const msg = e?.message ?? t('usersBarcodePrint.printFailed');
      const hint = t('desktop.labelPrinter', { defaultValue: 'Принтер штрих-кодов' });
      const showHint =
        isDesktopLabelPrintAvailable() && !/принтер/i.test(msg) && !/Aurent/i.test(msg);
      toast.error(showHint ? `${msg}. Aurent → «${hint}».` : msg);
    } finally {
      try {
        printRootRef.current?.unmount();
      } catch {
        /* ignore */
      }
      printRootRef.current = null;
      teardownLabelPrintMount();
    }
  }, [barcode, printNodes, showBarcode, t]);

  const openLabelPrinterPicker = useCallback(async () => {
    if (!canPickLabelPrinter) return;
    try {
      await window.desktopCashier.openLabelPrinterPicker();
      await reloadLabelPrinter();
      if (labelPrinterName) {
        toast.success(t('common.saved', { defaultValue: 'Сохранено' }));
      }
    } catch (e) {
      toast.error(e?.message || t('common.failed', { defaultValue: 'Не удалось' }));
    }
  }, [canPickLabelPrinter, labelPrinterName, reloadLabelPrinter, t]);

  useEffect(() => {
    void i18n.language;
  }, [i18n.language]);

  if (!open) return null;

  const tabCls = (active) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      active
        ? 'bg-emerald-600 text-white shadow'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
    }`;

  const toggleRow = (label, checked, onChange) => (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-b-0 dark:border-slate-700">
      <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="shelflabel-no-print-wrap fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal
        aria-labelledby="shelf-label-title"
        className="relative flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl dark:bg-slate-900 sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <div className="min-w-0">
            <h2 id="shelf-label-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              {t('usersBarcodePrint.modalTitle')}
            </h2>
            {canPickLabelPrinter && (
              <button
                type="button"
                onClick={openLabelPrinterPicker}
                className="mt-1 inline-flex items-center gap-2 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                title={labelPrinterName ? labelPrinterName : undefined}
              >
                <Settings2 size={14} aria-hidden />
                {t('desktop.labelPrinter', { defaultValue: 'Принтер штрих-кодов' })}
                {labelPrinterName ? `: ${labelPrinterName}` : ''}
              </button>
            )}
          </div>
          <button type="button" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose}>
            <X size={22} aria-hidden />
          </button>
        </header>

        <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700">
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button type="button" className={tabCls(variant === 'label')} onClick={() => setVariant('label')}>
              {t('usersBarcodePrint.tabLabel')}
            </button>
            <button type="button" className={tabCls(variant === 'priceTag')} onClick={() => setVariant('priceTag')}>
              {t('usersBarcodePrint.tabPriceTag')}
            </button>
          </div>
        </div>

        <div className="grow overflow-y-auto px-4">
          <div className="py-2">{toggleRow(t('usersBarcodePrint.showName'), showName, setShowName)}</div>
          <div>{toggleRow(t('usersBarcodePrint.showBarcode'), showBarcode, setShowBarcode)}</div>
          <div>{toggleRow(t('usersBarcodePrint.showPrice'), showPrice, setShowPrice)}</div>

          <div className="mx-auto my-4 max-w-[280px] rounded-xl border border-slate-200 bg-white p-4 shadow-inner dark:border-slate-600 dark:bg-slate-950">
            <LabelSheet
              variant={variant}
              productName={productName}
              barcode={barcode}
              price={price}
              showName={showName}
              showBarcode={showBarcode}
              showPrice={showPrice}
              currency={currency}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('usersBarcodePrint.printSettings', { defaultValue: 'Настройки печати' })}
            </p>

            <div className="mt-3 space-y-3">
              {toggleRow(
                t('usersBarcodePrint.rotate180', { defaultValue: 'Повернуть на 180°' }),
                labelSettings.rotate180,
                (v) => setLabelSettings((s) => ({ ...s, rotate180: v }))
              )}

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-700 dark:text-slate-200">
                  {t('usersBarcodePrint.textScale', { defaultValue: 'Размер текста' })}
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.8"
                    max="1.6"
                    step="0.02"
                    value={labelSettings.fontScale}
                    onChange={(e) =>
                      setLabelSettings((s) => ({ ...s, fontScale: clampNum(e.target.value, 0.8, 1.6) }))
                    }
                  />
                  <span className="w-12 text-right font-mono text-sm text-slate-600 dark:text-slate-300">
                    {Number(labelSettings.fontScale).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-700 dark:text-slate-200">
                  {t('usersBarcodePrint.padX', { defaultValue: 'Отступ слева/справа (мм)' })}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  value={labelSettings.padXmm}
                  min={0}
                  max={50}
                  step={0.5}
                  onChange={(e) =>
                    setLabelSettings((s) => ({
                      ...s,
                      padXmm: snapStep(clampNum(e.target.value, 0, 50), 0.5),
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-700 dark:text-slate-200">
                  {t('usersBarcodePrint.padY', { defaultValue: 'Отступ сверху/снизу (мм)' })}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  value={labelSettings.padYmm}
                  min={0}
                  max={70}
                  step={0.5}
                  onChange={(e) =>
                    setLabelSettings((s) => ({
                      ...s,
                      padYmm: snapStep(clampNum(e.target.value, 0, 70), 0.5),
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="mb-6 mt-2 flex items-center justify-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-400">{t('usersBarcodePrint.copies')}</span>
            <button
              type="button"
              className="h-10 w-10 rounded-lg border border-slate-300 bg-white text-lg dark:border-slate-600 dark:bg-slate-800"
              onClick={() => setCopies((c) => Math.max(1, c - 1))}
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={999}
              step={1}
              value={copies}
              onChange={(e) => setCopiesClamped(e.target.value)}
              className="h-10 w-20 rounded-lg border border-slate-300 bg-white px-2 text-center font-mono text-base text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="button"
              className="h-10 w-10 rounded-lg border border-slate-300 bg-white text-lg dark:border-slate-600 dark:bg-slate-800"
              onClick={() => setCopies((c) => Math.min(999, c + 1))}
            >
              +
            </button>
          </div>
        </div>

        <footer className="shrink-0 border-t border-slate-200 p-4 dark:border-slate-700">
          <button
            type="button"
            onClick={doPrint}
            className="w-full rounded-xl bg-emerald-700 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            <Printer size={18} className="mr-2 inline-block align-[-3px]" aria-hidden />
            {t('usersBarcodePrint.print')}
          </button>
        </footer>
      </div>
    </div>
  );
}
