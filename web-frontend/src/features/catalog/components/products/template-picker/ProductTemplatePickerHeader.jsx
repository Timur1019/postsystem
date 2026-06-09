import { ArrowLeft, X } from 'lucide-react';

export default function ProductTemplatePickerHeader({ t, onBackToStores, onClose }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        {onBackToStores ? (
          <button
            type="button"
            onClick={onBackToStores}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
            title={t('productTemplates.backToStores')}
          >
            <ArrowLeft size={18} />
          </button>
        ) : null}
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('productTemplates.pickerTitle')}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {t('productTemplates.pickerSubtitleStore')}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
      >
        <X size={20} />
      </button>
    </div>
  );
}
