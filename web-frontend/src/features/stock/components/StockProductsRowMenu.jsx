import { createPortal } from 'react-dom';

export default function StockProductsRowMenu({ menu, t, manage, onClose, onInfo, onEdit, onAdjust, onReceive, onDelete }) {
  if (!menu) return null;

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
          top: `${menu.rect.bottom + 4}px`,
          right: `${window.innerWidth - menu.rect.right}px`,
        }}
      >
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
          onClick={() => {
            onInfo(menu.product.id);
            onClose();
          }}
        >
          {t('products.info.open')}
        </button>
        {manage && (
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={() => {
              onEdit(menu.product);
              onClose();
            }}
          >
            {t('products.rowEdit')}
          </button>
        )}
        {manage && (
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={() => {
              onAdjust(menu.product);
              onClose();
            }}
          >
            {t('products.stockBtn')}
          </button>
        )}
        {manage && (
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={() => {
              onReceive({ id: menu.product.id, name: menu.product.name });
              onClose();
            }}
          >
            {t('products.rowReceive')}
          </button>
        )}
        {manage && (
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-xs text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/30"
            onClick={() => {
              onDelete(menu.product);
              onClose();
            }}
          >
            {t('products.rowDelete')}
          </button>
        )}
      </div>
    </>,
    document.body
  );
}
