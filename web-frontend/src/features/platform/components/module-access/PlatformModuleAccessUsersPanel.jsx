import PlatformModuleAccessUsersPanelHeader from './users/PlatformModuleAccessUsersPanelHeader';
import PlatformModuleAccessUsersList from './users/PlatformModuleAccessUsersList';
import PlatformModuleAccessUsersBulkFooter from './users/PlatformModuleAccessUsersBulkFooter';

export default function PlatformModuleAccessUsersPanel(props) {
  const {
    t,
    usersLoading,
    filteredUsers,
    unconfiguredCount,
    userSearch,
    onUserSearchChange,
    userFilter,
    onUserFilterChange,
    filterOptions,
    selectedUserId,
    onSelectUser,
    selectedUserIds,
    onToggleUserSelection,
    allFilteredSelected,
    onSelectAllFiltered,
    onBulkApply,
    bulkPending,
    bulkDisabled,
  } = props;

  return (
    <div className="module-access-panel rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <PlatformModuleAccessUsersPanelHeader
        t={t}
        unconfiguredCount={unconfiguredCount}
        userSearch={userSearch}
        onUserSearchChange={onUserSearchChange}
        userFilter={userFilter}
        onUserFilterChange={onUserFilterChange}
        filterOptions={filterOptions}
        allFilteredSelected={allFilteredSelected}
        onSelectAllFiltered={onSelectAllFiltered}
        filteredCount={filteredUsers.length}
      />
      <PlatformModuleAccessUsersList
        t={t}
        usersLoading={usersLoading}
        filteredUsers={filteredUsers}
        selectedUserId={selectedUserId}
        onSelectUser={onSelectUser}
        selectedUserIds={selectedUserIds}
        onToggleUserSelection={onToggleUserSelection}
      />
      <PlatformModuleAccessUsersBulkFooter
        t={t}
        selectedCount={selectedUserIds.size}
        bulkPending={bulkPending}
        bulkDisabled={bulkDisabled}
        onBulkApply={onBulkApply}
      />
    </div>
  );
}
