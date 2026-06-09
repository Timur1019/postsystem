import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

export default function SalesLedgerRowMenu({ menu, t, onClose, onPrint, onReturn }) {
  if (!menu) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[200] cursor-default"
        aria-label="close menu"
        onClick={onClose}
      />
      <div
        role="menu"
        className="fixed z-[210] min-w-[180px] rounded-lg border border-slate-200 bg-white py-1 text-left shadow-xl dark:border-slate-700 dark:bg-slate-800"
        style={{
          top: `${menu.rect.bottom + 4}px`,
          right: `${window.innerWidth - menu.rect.right}px`,
        }}
      >
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
          onClick={() => {
            onPrint(menu.row.id);
            onClose();
          }}
        >
          {t('salesLedger.printFiscal')}
        </button>
        <Link
          to={`/receipt/${menu.row.receiptNumber}`}
          className="block px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
          onClick={onClose}
        >
          {t('salesLedger.openReceipt')}
        </Link>
        {menu.row.status !== 'VOIDED' && (
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            onClick={() => {
              onReturn(menu.row.id);
              onClose();
            }}
          >
            {t('salesLedger.voidSale')}
          </button>
        )}
      </div>
    </>,
    document.body
  );
}
