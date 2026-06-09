import { Store } from 'lucide-react';

export default function ProductTemplatePickerStoreBanner({
  t,
  storeName,
  businessType,
  templateCount,
}) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
      <div className="flex items-start gap-3">
        <Store size={18} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{storeName}</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {t('productTemplates.storeTypeHint', {
              type: t(`productTemplates.businessTypes.${businessType}`),
            })}
          </p>
          {templateCount > 0 ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
              {t('productTemplates.templateCountHint', { count: templateCount })}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
