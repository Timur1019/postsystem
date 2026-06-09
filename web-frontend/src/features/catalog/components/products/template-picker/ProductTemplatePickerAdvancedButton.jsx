import { Settings2 } from 'lucide-react';

export default function ProductTemplatePickerAdvancedButton({ t, onAdvanced }) {
  return (
    <button
      type="button"
      onClick={onAdvanced}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-3 text-sm text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      <Settings2 size={16} />
      {t('productTemplates.advancedForm')}
    </button>
  );
}
