import PlatformModuleAccessModulesPlaceholder from './modules/PlatformModuleAccessModulesPlaceholder';
import PlatformModuleAccessModulesHeader from './modules/PlatformModuleAccessModulesHeader';
import PlatformModuleAccessModulesBody from './modules/PlatformModuleAccessModulesBody';
import PlatformModuleAccessModulesFooter from './modules/PlatformModuleAccessModulesFooter';

export default function PlatformModuleAccessModulesPanel({
  t,
  selectedUserId,
  selectedUser,
  detail,
  detailLoading,
  customAccess,
  onCustomAccessChange,
  groupedModules,
  moduleToggles,
  onToggleModule,
  onSetAllModules,
  onSave,
  onReset,
  isSaving,
  resetPending,
}) {
  if (!selectedUserId) {
    return <PlatformModuleAccessModulesPlaceholder message={t('platform.moduleAccess.pickUser')} />;
  }

  if (detailLoading) {
    return <PlatformModuleAccessModulesPlaceholder message={t('common.loading')} />;
  }

  return (
    <div className="module-access-panel rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <PlatformModuleAccessModulesHeader
        t={t}
        fullName={selectedUser?.fullName}
        role={detail.role}
        customAccess={customAccess}
        onCustomAccessChange={onCustomAccessChange}
        onSetAllModules={onSetAllModules}
      />
      <PlatformModuleAccessModulesBody
        t={t}
        groupedModules={groupedModules}
        moduleToggles={moduleToggles}
        onToggleModule={onToggleModule}
        onSetAllModules={onSetAllModules}
      />
      <PlatformModuleAccessModulesFooter
        t={t}
        onReset={onReset}
        onSave={onSave}
        isSaving={isSaving}
        resetPending={resetPending}
      />
    </div>
  );
}
