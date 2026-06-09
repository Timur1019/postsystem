import { Percent } from 'lucide-react';
import { inputCls } from '../../../../../../utils/productImportUtils';

export default function ProductImportPreviewControls({
  t,
  markupInput,
  onMarkupInputChange,
  onMarkupInputBlur,
  applyMarkupPreset,
  applyMarkupToAll,
  defaultCategoryId,
  setDefaultCategoryId,
  applyDefaultCategoryToAll,
  categories,
  defaultStoreId,
  setDefaultStoreId,
  applyDefaultStoreToAll,
  stores,
}) {
  return (
    <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50 md:grid-cols-3">
      <div>
        <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
          {t('products.import.markupLabel')}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={markupInput}
            onChange={(e) => onMarkupInputChange(e.target.value)}
            onBlur={onMarkupInputBlur}
            className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            aria-label={t('products.import.markupLabel')}
          />
          <span className="text-sm text-slate-500">%</span>
          <button
            type="button"
            onClick={() => applyMarkupPreset(0)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-white dark:border-slate-600 dark:text-slate-300"
          >
            {t('products.import.markup0')}
          </button>
          <button
            type="button"
            onClick={() => applyMarkupPreset(10)}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400"
          >
            <Percent size={14} />
            {t('products.import.markup10')}
          </button>
          <button
            type="button"
            onClick={applyMarkupToAll}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-white dark:border-slate-600 dark:text-slate-300"
          >
            {t('products.import.applyMarkup')}
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
          {t('products.import.defaultCategory')}
        </p>
        <div className="flex gap-2">
          <select
            value={defaultCategoryId}
            onChange={(e) => setDefaultCategoryId(e.target.value)}
            className={inputCls}
          >
            <option value="">{t('products.import.noCategory')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={applyDefaultCategoryToAll}
            disabled={!defaultCategoryId}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-white disabled:opacity-50 dark:border-slate-600 dark:text-slate-300"
          >
            {t('products.import.applyCategoryAll')}
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
          {t('products.import.defaultStore')}
        </p>
        <div className="flex gap-2">
          <select
            value={defaultStoreId}
            onChange={(e) => setDefaultStoreId(e.target.value)}
            className={inputCls}
          >
            <option value="">{t('products.import.noStore')}</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={applyDefaultStoreToAll}
            disabled={!defaultStoreId}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-white disabled:opacity-50 dark:border-slate-600 dark:text-slate-300"
          >
            {t('products.import.applyStoreAll')}
          </button>
        </div>
      </div>
    </div>
  );
}
