import { X } from 'lucide-react';

export default function ProductCatalogModalHeader({
  t,
  isEdit,
  universalMode,
  templateTitle,
  advancedMode,
  canToggleAdvanced,
  onToggleAdvanced,
  onClose,
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEdit ? t('productCatalog.editTitle') : t('productCatalog.addTitle')}
          </h2>
          {universalMode ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              {t('productTemplates.universalBadge')}
            </p>
          ) : null}
          {templateTitle ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              {t('productTemplates.formBadge', { template: templateTitle })}
            </p>
          ) : null}
          {advancedMode && !universalMode ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('productTemplates.advancedBadge')}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isEdit && canToggleAdvanced && !universalMode ? (
          <button
            type="button"
            onClick={onToggleAdvanced}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {advancedMode
              ? t('productTemplates.showTemplateFields')
              : t('productTemplates.showAllFields')}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
