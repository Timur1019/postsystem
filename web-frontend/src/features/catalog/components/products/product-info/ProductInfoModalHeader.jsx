import { X } from 'lucide-react';

export default function ProductInfoModalHeader({ t, productName, onClose }) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('products.info.title')}</h2>
        {productName && (
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{productName}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
        aria-label="Close"
      >
        <X size={20} />
      </button>
    </div>
  );
}
