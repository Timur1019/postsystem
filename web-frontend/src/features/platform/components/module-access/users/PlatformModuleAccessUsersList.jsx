export default function PlatformModuleAccessUsersList({
  t,
  usersLoading,
  filteredUsers,
  selectedUserId,
  onSelectUser,
  selectedUserIds,
  onToggleUserSelection,
}) {
  return (
    <div className="module-access-panel__body max-h-[min(70vh,520px)] overflow-y-auto">
      {usersLoading ? (
        <p className="p-4 text-sm text-slate-500">{t('common.loading')}</p>
      ) : filteredUsers.length === 0 ? (
        <p className="p-4 text-sm text-slate-500">{t('platform.noSearchResults')}</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredUsers.map((u) => (
            <li key={u.userId} className="flex items-stretch">
              <label className="flex items-center px-3">
                <input
                  type="checkbox"
                  checked={selectedUserIds.has(u.userId)}
                  onChange={() => onToggleUserSelection(u.userId)}
                />
              </label>
              <button
                type="button"
                onClick={() => onSelectUser(u.userId)}
                className={`module-access-user-row flex min-w-0 flex-1 flex-col items-start gap-0.5 px-2 py-3 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                  selectedUserId === u.userId ? 'module-access-user-row--selected' : ''
                }`}
              >
                <span className="font-medium text-slate-900 dark:text-white">{u.fullName}</span>
                <span className="text-xs text-slate-500">
                  {u.username} · {t(`roles.${u.role}`, u.role)}
                  {u.moduleAccessCustom ? (
                    <span className="module-access-user-row__badge ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200">
                      {t('platform.moduleAccess.customBadge')}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
