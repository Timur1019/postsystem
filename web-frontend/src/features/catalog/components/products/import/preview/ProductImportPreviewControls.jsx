import { Percent } from 'lucide-react';
import { BaseSelect } from '../../../../../../components/ui';

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
          <BaseSelect
            className="flex-1"
            value={defaultCategoryId}
            onChange={(e) => setDefaultCategoryId(e.target.value)}
            placeholder={t('products.import.noCategory')}
            options={[
              { value: '', label: t('products.import.noCategory') },
              ...categories.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
          />
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
          <BaseSelect
            className="flex-1"
            value={defaultStoreId}
            onChange={(e) => setDefaultStoreId(e.target.value)}
            placeholder={t('products.import.noStore')}
            options={[
              { value: '', label: t('products.import.noStore') },
              ...stores.map((s) => ({ value: String(s.id), label: s.name })),
            ]}
          />
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
