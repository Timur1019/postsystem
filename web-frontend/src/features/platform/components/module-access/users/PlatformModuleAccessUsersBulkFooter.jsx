import { Users } from 'lucide-react';
import { BaseButton } from '../../../../../components/ui';

export default function PlatformModuleAccessUsersBulkFooter({
  t,
  selectedCount,
  bulkPending,
  bulkDisabled,
  onBulkApply,
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="module-access-panel__footer border-t border-slate-200 p-3 dark:border-slate-800">
      <BaseButton
        className="w-full bg-violet-600 hover:bg-violet-700 dark:bg-violet-600"
        disabled={bulkDisabled}
        onClick={onBulkApply}
      >
        <Users size={16} />
        {bulkPending
          ? t('common.loading')
          : t('platform.moduleAccess.applyToSelected', { count: selectedCount })}
      </BaseButton>
      <p className="mt-1 text-xs text-slate-500">{t('platform.moduleAccess.bulkHint')}</p>
    </div>
  );
}
