import { X } from 'lucide-react';

export default function ProductFiltersDrawerHeader({ t, onClose }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
      <h2 className="font-semibold text-slate-900 dark:text-white">{t('products.filters.title')}</h2>
      <button
        type="button"
        onClick={onClose}
        className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
      >
        <X size={20} />
      </button>
    </div>
  );
}
