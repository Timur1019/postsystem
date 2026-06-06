import { isRowDuplicate } from '../../../utils/productImportUtils';

export default function ProductImportNameCell({ row }) {
  const isDup = isRowDuplicate(row);
  return (
    <>
      <div className="font-mono text-xs text-slate-500">{row.sku}</div>
      <div
        className={`line-clamp-2 ${isDup ? 'text-amber-900/90 dark:text-amber-100' : 'text-slate-800 dark:text-slate-200'}`}
      >
        {row.name}
      </div>
      {row.uzInvoiceDocumentId ? (
        <div className="mt-0.5 font-mono text-[10px] text-slate-500">{row.uzInvoiceDocumentId}</div>
      ) : null}
      {isDup && (row.existingSku || row.existingName) && (
        <div className="mt-1 text-xs text-amber-700 dark:text-amber-400">
          {row.existingSku && <span className="font-mono">{row.existingSku}</span>}
          {row.existingSku && row.existingName && ' · '}
          {row.existingName}
        </div>
      )}
    </>
  );
}
