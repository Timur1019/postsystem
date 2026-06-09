export default function PlatformModuleAccessModuleGroup({
  t,
  group,
  items,
  moduleToggles,
  onToggleModule,
  onSetAll,
}) {
  return (
    <section className="module-access-group">
      <div className="module-access-group__header mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {t(`platform.moduleGroups.${group}`, { defaultValue: group })}
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            className="module-access-group__action rounded border px-1.5 py-0.5 text-[10px]"
            onClick={() => onSetAll(true, group)}
          >
            {t('platform.moduleAccess.allOn')}
          </button>
          <button
            type="button"
            className="module-access-group__action rounded border px-1.5 py-0.5 text-[10px]"
            onClick={() => onSetAll(false, group)}
          >
            {t('platform.moduleAccess.allOff')}
          </button>
        </div>
      </div>
      <ul className="space-y-1">
        {items.map((row) => (
          <li
            key={row.id}
            className="module-access-module flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {t([`platform.modules.${row.id}`, `nav.${row.id}`], { defaultValue: row.id })}
              </p>
              <p className="text-xs text-slate-400">
                {t('platform.moduleAccess.roleDefault')}:{' '}
                {row.roleDefault ? t('common.confirmYes', 'Да') : t('common.confirmNo', 'Нет')}
              </p>
            </div>
            <input
              type="checkbox"
              checked={!!moduleToggles[row.id]}
              onChange={(e) => onToggleModule(row.id, e.target.checked)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
