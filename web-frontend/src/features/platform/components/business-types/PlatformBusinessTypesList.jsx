import { Layers } from 'lucide-react';

export default function PlatformBusinessTypesList({ t, types, isLoading, activeTypeId, onSelect }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800">
        {t('platform.businessTypes.typesList')}
      </div>
      <div className="max-h-[520px] overflow-y-auto p-2">
        {isLoading ? (
          <p className="px-2 py-4 text-sm text-slate-500">{t('common.loading')}</p>
        ) : (
          types.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id)}
              className={`mb-1 flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                activeTypeId === type.id
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Layers size={16} className="mt-0.5 shrink-0" />
              <span>
                <span className="block font-medium">{type.name}</span>
                <span className={`text-xs ${activeTypeId === type.id ? 'text-emerald-50' : 'text-slate-500'}`}>
                  {type.code} · {type.fieldsCount}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
