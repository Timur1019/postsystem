import { RotateCcw, Save } from 'lucide-react';
import { BaseButton } from '../../../../../components/ui';

export default function PlatformModuleAccessModulesFooter({
  t,
  onReset,
  onSave,
  isSaving,
  resetPending,
}) {
  return (
    <div className="module-access-panel__footer flex flex-wrap justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
      <BaseButton variant="secondary" disabled={resetPending || isSaving} onClick={onReset}>
        <RotateCcw size={16} />
        {t('platform.moduleAccess.resetRole')}
      </BaseButton>
      <BaseButton disabled={isSaving} onClick={onSave}>
        <Save size={16} />
        {t('common.save')}
      </BaseButton>
    </div>
  );
}
