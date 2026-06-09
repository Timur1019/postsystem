import { createPortal } from 'react-dom';

export default function ZReportsRowMenu({
  t,
  menu,
  onClose,
  onExportSales,
  onPrint,
}) {
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
        className="fixed z-[210] min-w-[280px] max-w-[90vw] rounded-lg border border-slate-200 bg-white py-2 text-left shadow-xl dark:border-slate-700 dark:bg-slate-800"
        style={{
          top: `${menu.rect.bottom + 4}px`,
          right: `${window.innerWidth - menu.rect.right}px`,
        }}
      >
        <div className="flex flex-wrap gap-1 px-2">
          <button
            type="button"
            className="flex-1 rounded px-2 py-2 text-left text-xs font-medium text-emerald-800 hover:bg-emerald-50 dark:text-emerald-200 dark:hover:bg-emerald-950/40"
            onClick={onExportSales}
          >
            {t('zReports.rowExportSales')}
          </button>
          <button
            type="button"
            className="flex-1 rounded px-2 py-2 text-left text-xs font-medium text-emerald-800 hover:bg-emerald-50 dark:text-emerald-200 dark:hover:bg-emerald-950/40"
            onClick={onPrint}
          >
            {t('receipt.print')}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
