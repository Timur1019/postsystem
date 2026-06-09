export default function ProductInfoModalFooter({ t, product, onEdit, onReceive, onDelete, onClose }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
      <button
        type="button"
        onClick={() => onEdit?.(product)}
        disabled={!product}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-600"
      >
        {t('products.rowEdit')}
      </button>
      <button
        type="button"
        onClick={() => onReceive?.(product)}
        disabled={!product}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-600"
      >
        {t('products.rowReceive')}
      </button>
      <button
        type="button"
        onClick={() => onDelete?.(product)}
        disabled={!product}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-600"
      >
        {t('products.rowDelete')}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {t('products.info.close')}
      </button>
    </div>
  );
}
