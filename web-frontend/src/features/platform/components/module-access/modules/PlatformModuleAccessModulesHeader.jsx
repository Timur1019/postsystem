export default function PlatformModuleAccessModulesHeader({
  t,
  fullName,
  role,
  customAccess,
  onCustomAccessChange,
  onSetAllModules,
}) {
  return (
    <div className="module-access-panel__header border-b border-slate-200 px-4 py-3 dark:border-slate-800">
      <p className="font-semibold text-slate-900 dark:text-white">{fullName}</p>
      <p className="text-xs text-slate-500">{t(`roles.${role}`, role)}</p>
      <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={customAccess}
          onChange={(e) => onCustomAccessChange(e.target.checked)}
        />
        <span>{t('platform.moduleAccess.useCustom')}</span>
      </label>
      {!customAccess ? (
        <p className="mt-1 text-xs text-amber-600">{t('platform.moduleAccess.customHint')}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="module-access-group__action rounded border px-2 py-1 text-xs"
          onClick={() => onSetAllModules(true)}
        >
          {t('platform.moduleAccess.enableAll')}
        </button>
        <button
          type="button"
          className="module-access-group__action rounded border px-2 py-1 text-xs"
          onClick={() => onSetAllModules(false)}
        >
          {t('platform.moduleAccess.disableAll')}
        </button>
      </div>
    </div>
  );
}
