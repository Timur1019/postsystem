import { Users } from 'lucide-react';
import { userDisplayName, userMetaLine } from '../../utils/emailUtils';

export default function PlatformEmailRecipientsList({
  t,
  selectAllActive,
  onSelectAllActive,
  userSearch,
  onUserSearchChange,
  filteredUsers,
  usersLoading,
  allVisibleSelected,
  onSelectAllVisible,
  selectedIds,
  onToggleUser,
}) {
  return (
    <>
      <div className="platform-email-field">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={selectAllActive} onChange={(e) => onSelectAllActive(e.target.checked)} />
          <Users size={14} />
          {t('platform.email.selectAll')}
        </label>
        <p className="platform-email-hint">{t('platform.email.selectAllHint')}</p>
      </div>

      {!selectAllActive ? (
        <div className="platform-email-field">
          <label htmlFor="email-user-search">{t('platform.email.recipients')}</label>
          <input
            id="email-user-search"
            value={userSearch}
            onChange={(e) => onUserSearchChange(e.target.value)}
            placeholder={t('platform.email.recipientSearch')}
          />
          <label className="platform-email-select-all">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={(e) => onSelectAllVisible(e.target.checked)}
            />
            {t('platform.email.selectAllVisible', { count: filteredUsers.length })}
          </label>
          <div className="platform-email-users">
            {usersLoading ? (
              <p className="platform-email-hint">{t('common.loading')}</p>
            ) : filteredUsers.length === 0 ? (
              <p className="platform-email-hint">{t('platform.email.noUsers')}</p>
            ) : (
              filteredUsers.map((user) => (
                <label key={user.id} className="platform-email-user-row">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(user.id)}
                    onChange={() => onToggleUser(user.id)}
                  />
                  <span className="platform-email-user-row__text">
                    <span className="platform-email-user-row__name">{userDisplayName(user)}</span>
                    <span className="platform-email-user-row__meta">{userMetaLine(user, t)}</span>
                  </span>
                </label>
              ))
            )}
          </div>
          {selectedIds.size > 0 ? (
            <p className="platform-email-hint">{t('platform.email.selectedCount', { count: selectedIds.size })}</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
