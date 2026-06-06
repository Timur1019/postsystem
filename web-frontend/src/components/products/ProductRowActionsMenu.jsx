import { createPortal } from 'react-dom';

export default function ProductRowActionsMenu({
  rowMenu,
  manage,
  t,
  onClose,
  onOpenInfo,
  onOpenLifecycle,
  onLifecycleReport,
  onEdit,
  onAdjustStock,
  onReceive,
  onDelete,
}) {
  if (!rowMenu) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[80] cursor-default"
        aria-label="close menu"
        onClick={onClose}
      />
      <div
        role="menu"
        className="fixed z-[90] min-w-[160px] rounded-lg border border-slate-200 bg-white py-1 text-left shadow-xl dark:border-slate-700 dark:bg-slate-800"
        style={{
          top: `${rowMenu.rect.bottom + 4}px`,
          right: `${window.innerWidth - rowMenu.rect.right}px`,
        }}
      >
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
          onClick={() => onOpenInfo(rowMenu.product)}
        >
          {t('products.info.open')}
        </button>
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
          onClick={() => onOpenLifecycle(rowMenu.product)}
        >
          {t('products.info.openLifecycle')}
        </button>
        {manage && (
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={() => onLifecycleReport(rowMenu.product)}
          >
            {t('products.rowLifecycleReport')}
          </button>
        )}
        {manage && (
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={() => onEdit(rowMenu.product)}
          >
            {t('products.rowEdit')}
          </button>
        )}
        {manage && (
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={() => onAdjustStock(rowMenu.product)}
          >
            {t('products.stockBtn')}
          </button>
        )}
        {manage && (
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={() => onReceive(rowMenu.product)}
          >
            {t('products.rowReceive')}
          </button>
        )}
        {manage && (
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-xs text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/30"
            onClick={() => onDelete(rowMenu.product)}
          >
            {t('products.rowDelete')}
          </button>
        )}
      </div>
    </>,
    document.body
  );
}
