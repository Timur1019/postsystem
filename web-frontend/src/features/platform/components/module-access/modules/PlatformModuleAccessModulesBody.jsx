import PlatformModuleAccessModuleGroup from '../PlatformModuleAccessModuleGroup';

export default function PlatformModuleAccessModulesBody({
  t,
  groupedModules,
  moduleToggles,
  onToggleModule,
  onSetAllModules,
}) {
  return (
    <div className="module-access-panel__body max-h-[min(55vh,440px)] space-y-4 overflow-y-auto p-4">
      {groupedModules.map(({ group, items }) => (
        <PlatformModuleAccessModuleGroup
          key={group}
          t={t}
          group={group}
          items={items}
          moduleToggles={moduleToggles}
          onToggleModule={onToggleModule}
          onSetAll={onSetAllModules}
        />
      ))}
    </div>
  );
}
