import { Info, MoreVertical } from 'lucide-react';
import TablePagination from '../../../components/shared/TablePagination';

const COL_COUNT = 7;

export default function StockProductsTable({
  t,
  rows,
  loading,
  showEmptyHint,
  displayBarcode,
  onOpenRowMenu,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
              <th className="px-4 py-3">{t('stockModule.colProduct')}</th>
              <th className="px-4 py-3">{t('stockModule.colCategory')}</th>
              <th className="px-4 py-3">{t('stockModule.colQty')}</th>
              <th className="px-4 py-3">{t('stockModule.colDispatched')}</th>
              <th className="px-4 py-3">{t('stockModule.colBarcode')}</th>
              <th className="px-4 py-3">{t('stockModule.colLocation')}</th>
              <th className="px-4 py-3 w-12 text-right font-medium normal-case" aria-label={t('stockModule.colActions')} />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={COL_COUNT} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  {t('common.loading')}
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800/80"
                >
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{product.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{product.categoryName ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{product.stockQuantity}</td>
                  <td className="px-4 py-3 font-semibold text-amber-700 dark:text-amber-400">
                    {product.stockDispatched ?? 0}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                    {displayBarcode(product)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {product.storageLocation?.trim() || '—'}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <button
                      type="button"
                      className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRowMenu(product, e.currentTarget.getBoundingClientRect());
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showEmptyHint && (
        <div className="flex items-start gap-3 border-t border-sky-100 bg-sky-50 px-4 py-4 text-sm text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-100">
          <Info size={18} className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" />
          <span>{t('stockModule.empty')}</span>
        </div>
      )}

      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
