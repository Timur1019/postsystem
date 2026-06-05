import { Printer, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ShelfLabelPrintSettingsPanel from './ShelfLabelPrintSettingsPanel';
import { CopiesStepper, ToggleSwitch, VariantTabs } from './ShelfLabelPrintControls';
import ShelfLabelSheet from './ShelfLabelSheet';
import { useShelfLabelPrint } from './useShelfLabelPrint';

/**
 * Модалка этикетки / ценника. Печать — ESC/POS как чек / Z / X (printShelfLabel).
 */
export default function ShelfLabelPrintModal({
  open,
  onClose,
  productName,
  barcode,
  price,
  autoLabelPrint = false,
  defaultVariant = 'label',
}) {
  const { t } = useTranslation();
  const state = useShelfLabelPrint({
    open,
    productName,
    barcode,
    price,
    autoLabelPrint,
    defaultVariant,
  });

  if (!open) return null;

  const formatMm = (n) => Number(n).toFixed(n % 1 ? 2 : 0);

  return (
    <div className="shelflabel-no-print-wrap fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal
        aria-labelledby="shelf-label-title"
        className="relative flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl dark:bg-slate-900 sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <h2 id="shelf-label-title" className="text-lg font-semibold text-slate-900 dark:text-white">
            {t('usersBarcodePrint.modalTitle')}
          </h2>
          <button
            type="button"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
          >
            <X size={22} aria-hidden />
          </button>
        </header>

        <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700">
          <VariantTabs
            variant={state.variant}
            onChange={state.setVariant}
            labelTab={t('usersBarcodePrint.tabLabel')}
            priceTagTab={t('usersBarcodePrint.tabPriceTag')}
          />
        </div>

        <div className="grow overflow-y-auto px-4">
          <ToggleSwitch label={t('usersBarcodePrint.showName')} checked={state.showName} onChange={state.setShowName} />
          <ToggleSwitch
            label={t('usersBarcodePrint.showBarcode')}
            checked={state.showBarcode}
            onChange={state.setShowBarcode}
          />
          <ToggleSwitch label={t('usersBarcodePrint.showPrice')} checked={state.showPrice} onChange={state.setShowPrice} />

          <div className="shelflabel-preview-wrap my-4 rounded-xl border border-slate-200 bg-white p-3 shadow-inner dark:border-slate-600 dark:bg-slate-950">
            <ShelfLabelSheet {...state.sheetProps} />
          </div>

          {state.autoLabelPrint ? (
            <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2.5 text-center text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
              <p>
                {t('usersBarcodePrint.autoPaperSize', {
                  defaultValue: 'Размер бумаги подобран автоматически: {{w}} × {{h}} мм',
                  w: formatMm(state.layout.paperWmm),
                  h: formatMm(state.layout.paperHmm),
                })}
              </p>
              {state.activePreset ? (
                <p className="mt-1 text-xs opacity-90">{t(state.activePreset.i18nKey)}</p>
              ) : null}
            </div>
          ) : (
            <div className="mb-4">
              <ShelfLabelPrintSettingsPanel
                t={t}
                layout={state.layout}
                patchLayout={state.patchLayout}
                maxPadXmm={state.maxPadXmm}
                maxPadYmm={state.maxPadYmm}
                applyPreset={state.applyPreset}
              />
            </div>
          )}

          <CopiesStepper
            label={t('usersBarcodePrint.copies')}
            copies={state.copies}
            onChange={state.setCopies}
            onBump={state.bumpCopies}
          />
        </div>

        <footer className="shrink-0 border-t border-slate-200 p-4 dark:border-slate-700">
          <button
            type="button"
            disabled={state.printing}
            onClick={() => void state.tryPrint()}
            className="w-full rounded-xl bg-emerald-700 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            <Printer size={18} className="mr-2 inline-block align-[-3px]" aria-hidden />
            {state.printing
              ? t('common.loading', { defaultValue: 'Печать…' })
              : t('usersBarcodePrint.print')}
          </button>
        </footer>
      </div>
    </div>
  );
}
