import { AlertTriangle, MoreVertical } from 'lucide-react';
import { fmtMoney as fmtNum } from '../../utils/formatMoney';
import TablePagination from '../shared/TablePagination';
import { getProductTemplateTitle } from '../../config/productCatalogTemplateRegistry';

export default function ProductsTable({
  t,
  isLoading,
  data,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  selectedIds,
  toggleSelect,
  allPageSelected,
  somePageSelected,
  toggleSelectAllPage,
  selectAllRef,
  onOpenRowMenu,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[960px]">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:text-slate-500">
              <th className="px-3 py-3 w-10">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleSelectAllPage}
                  className="rounded border-slate-400 dark:border-slate-600"
                />
              </th>
              <th className="px-3 py-3 font-medium">{t('products.colIkpuId')}</th>
              <th className="px-3 py-3 font-medium">{t('products.colName')}</th>
              <th className="px-3 py-3 font-medium">{t('products.colCategory')}</th>
              <th className="px-3 py-3 font-medium text-right">{t('products.colPrices')}</th>
              <th className="px-3 py-3 font-medium text-right">{t('products.colVat')}</th>
              <th className="px-3 py-3 font-medium">{t('products.colMarking')}</th>
              <th className="px-3 py-3 font-medium text-center">{t('products.colStores')}</th>
              <th className="px-3 py-3 font-medium text-right">{t('products.colStock')}</th>
              <th className="px-3 py-3 font-medium text-right">{t('products.colDispatched')}</th>
              <th className="px-3 py-3 font-medium w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : data?.content?.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                  {t('products.none')}
                </td>
              </tr>
            ) : (
              data.content.map((p) => (
                <tr key={p.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="rounded border-slate-400 dark:border-slate-600"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-mono text-xs leading-tight text-slate-700 dark:text-slate-300">
                      {p.ikpu ? <span>{p.ikpu}</span> : <span className="text-slate-400 dark:text-slate-600">—</span>}
                      <div className="max-w-[140px] break-all text-[11px] text-slate-500 dark:text-slate-500">{p.id}</div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium text-slate-900 dark:text-white">{p.name}</div>
                    {getProductTemplateTitle(t, p) ? (
                      <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-500">
                        {getProductTemplateTitle(t, p)}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-400">{p.categoryName ?? '—'}</td>
                  <td className="px-3 py-3 text-right font-semibold whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                    {fmtNum(p.sellingPrice)}
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap text-slate-700 dark:text-slate-300">
                    {p.taxRate != null ? `${Number(p.taxRate)}%` : '—'}
                  </td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-400">
                    {p.markedProduct ? t('products.markingYes') : '—'}
                  </td>
                  <td className="px-3 py-3 text-center text-slate-700 dark:text-slate-300">{p.storesCount ?? 0}</td>
                  <td className="px-3 py-3 text-right">
                    <span className={`font-semibold ${p.lowStock ? 'text-red-500 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                      {p.stockQuantity}
                      {p.lowStock && <AlertTriangle size={12} className="inline ml-1" />}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-amber-700 dark:text-amber-400">
                    {p.stockDispatched ?? 0}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <button
                      type="button"
                      className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        onOpenRowMenu(p, rect);
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
