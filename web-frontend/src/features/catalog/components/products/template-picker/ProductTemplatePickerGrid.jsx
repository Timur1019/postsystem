export default function ProductTemplatePickerGrid({ t, templates, onSelectTemplate }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {templates.map((tpl) => {
        const Icon = tpl.icon;
        return (
          <button
            key={tpl.code}
            type="button"
            onClick={() => onSelectTemplate(tpl.code)}
            className="group flex flex-col items-start rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-emerald-600"
          >
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Icon size={20} />
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {t(`productTemplates.${tpl.code}.title`)}
            </span>
            <span className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {t(`productTemplates.${tpl.code}.hint`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
