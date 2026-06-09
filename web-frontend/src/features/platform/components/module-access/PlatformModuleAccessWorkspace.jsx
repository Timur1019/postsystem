import PlatformModuleAccessUsersPanel from './PlatformModuleAccessUsersPanel';
import PlatformModuleAccessModulesPanel from './PlatformModuleAccessModulesPanel';

export default function PlatformModuleAccessWorkspace({ p }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <PlatformModuleAccessUsersPanel
        t={p.t}
        usersLoading={p.usersLoading}
        filteredUsers={p.filteredUsers}
        unconfiguredCount={p.unconfiguredCount}
        userSearch={p.userSearch}
        onUserSearchChange={p.setUserSearch}
        userFilter={p.userFilter}
        onUserFilterChange={p.setUserFilter}
        filterOptions={p.filterOptions}
        selectedUserId={p.selectedUserId}
        onSelectUser={p.setSelectedUserId}
        selectedUserIds={p.selectedUserIds}
        onToggleUserSelection={p.toggleUserSelection}
        allFilteredSelected={p.allFilteredSelected}
        onSelectAllFiltered={p.handleSelectAllFilteredUsers}
        onBulkApply={p.handleBulkApply}
        bulkPending={p.bulkSaveMutation.isPending}
        bulkDisabled={!p.selectedUserId || p.bulkSaveMutation.isPending || !p.customAccess}
      />
      <PlatformModuleAccessModulesPanel
        t={p.t}
        selectedUserId={p.selectedUserId}
        selectedUser={p.selectedUser}
        detail={p.detail}
        detailLoading={p.detailLoading}
        customAccess={p.customAccess}
        onCustomAccessChange={p.setCustomAccess}
        groupedModules={p.groupedModules}
        moduleToggles={p.moduleToggles}
        onToggleModule={p.handleToggleModule}
        onSetAllModules={p.setAllModules}
        onSave={p.handleSave}
        onReset={() => p.resetMutation.mutate()}
        isSaving={p.isSaving}
        resetPending={p.resetMutation.isPending}
      />
    </div>
  );
}
