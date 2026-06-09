import { Search } from 'lucide-react';
import { inputCls } from '../../../../../components/ui';

export default function PlatformModuleAccessUsersPanelHeader({
  t,
  unconfiguredCount,
  userSearch,
  onUserSearchChange,
  userFilter,
  onUserFilterChange,
  filterOptions,
  allFilteredSelected,
  onSelectAllFiltered,
  filteredCount,
}) {
  return (
    <div className="module-access-panel__header border-b border-slate-200 px-4 py-3 dark:border-slate-800">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{t('platform.moduleAccess.users')}</span>
        {unconfiguredCount > 0 ? (
          <span className="module-access-panel__badge rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
            {t('platform.moduleAccess.unconfiguredCount', { count: unconfiguredCount })}
          </span>
        ) : null}
      </div>
      <div className="relative mt-2">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={userSearch}
          onChange={(e) => onUserSearchChange(e.target.value)}
          placeholder={t('platform.userSearch')}
          className={`${inputCls} py-2 pl-8 pr-2`}
        />
      </div>
      <div className="module-access-filters mt-2 flex flex-wrap gap-1">
        {filterOptions.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onUserFilterChange(key)}
            className={`module-access-filters__chip rounded-full px-2.5 py-1 text-xs font-medium ${
              userFilter === key ? 'module-access-filters__chip--active' : ''
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
        <input
          type="checkbox"
          checked={allFilteredSelected}
          onChange={(e) => onSelectAllFiltered(e.target.checked)}
        />
        {t('platform.moduleAccess.selectAllVisible', { count: filteredCount })}
      </label>
    </div>
  );
}
