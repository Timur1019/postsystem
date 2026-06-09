import { Printer } from 'lucide-react';
import { barcodePrintInputCls } from './barcodePrintFormUi';

export default function BarcodePrintCurrentItemSection({
  t,
  draft,
  priceInput,
  onPriceChange,
  onOpenPrint,
}) {
  return (
    <section className="barcode-print-page__card">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {t('usersBarcodePrint.currentItem')}
        </h2>
        {draft ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
            {draft.source === 'catalog' ? t('usersBarcodePrint.sourceCatalog') : t('usersBarcodePrint.sourceTasnif')}
          </span>
        ) : null}
      </div>

      {!draft ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('usersBarcodePrint.currentItemEmpty')}</p>
      ) : (
        <>
          <div className="space-y-3 text-sm">
            <div>
              <label className="block text-xs text-slate-500">{t('products.colName')}</label>
              <p className="font-medium text-slate-900 dark:text-white">{draft.name}</p>
            </div>
            <div>
              <label className="block text-xs text-slate-500">{t('productModal.barcode')}</label>
              <p className="font-mono text-slate-900 dark:text-white">{draft.barcode || '—'}</p>
            </div>
            {draft.mxik && (
              <div>
                <label className="block text-xs text-slate-500">{t('productCatalog.ikpu')}</label>
                <p className="font-mono text-slate-900 dark:text-white">{draft.mxik}</p>
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-500">{t('products.colPrice')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`${barcodePrintInputCls} max-w-[12rem]`}
                  value={priceInput}
                  onChange={(e) => onPriceChange(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">{t('usersBarcodePrint.priceHint')}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenPrint}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              <Printer size={18} aria-hidden />
              {t('usersBarcodePrint.openPrint')}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
