import {
  formatImportMoney,
  inputCls,
  isRowDuplicate,
  isRowInvalid,
  isRowNew,
} from '../../../../../../utils/productImportUtils';
import { productImportStatusBadge } from '../../../../utils/productImportStatusBadge';
import ProductImportNameCell from '../ProductImportNameCell';

export default function ProductImportPreviewTable({
  t,
  rows,
  editable,
  categories,
  stores,
  setRowPrice,
  setRowCategory,
  setRowStore,
  setRowStorageLocation,
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="max-h-80 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-100 text-xs uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-2 py-2">#</th>
              <th className="px-2 py-2">{t('products.import.colName')}</th>
              <th className="px-2 py-2">{t('products.import.colLocation')}</th>
              <th className="px-2 py-2 text-right">{t('products.import.colFilePrice')}</th>
              <th className="px-2 py-2 text-right">{t('products.import.colImportPrice')}</th>
              <th className="px-2 py-2">{t('products.import.colCategory')}</th>
              <th className="px-2 py-2">{t('products.import.colStore')}</th>
              <th className="px-2 py-2">{t('products.import.colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const ed = editable[r.rowNum];
              const isNew = isRowNew(r);
              const isDup = isRowDuplicate(r);
              const isInv = isRowInvalid(r);
              return (
                <tr
                  key={r.rowNum}
                  className={`border-t border-slate-100 dark:border-slate-800 ${
                    isDup
                      ? 'product-import-row--duplicate bg-amber-100/80 dark:bg-amber-500/15'
                      : isInv
                        ? 'bg-red-50/40 dark:bg-red-500/5'
                        : ''
                  }`}
                >
                  <td className="px-2 py-2 text-slate-500">{r.rowNum}</td>
                  <td className="px-2 py-2">
                    <ProductImportNameCell row={r} />
                  </td>
                  <td className="px-2 py-2">
                    {isNew && ed ? (
                      <input
                        type="text"
                        value={ed.storageLocation ?? ''}
                        onChange={(e) => setRowStorageLocation(r.rowNum, e.target.value)}
                        placeholder={t('products.import.defaultLocationPh')}
                        className={inputCls}
                      />
                    ) : (
                      <span className="text-slate-500">{r.storageLocation || '—'}</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-400">
                    {formatImportMoney(r.fileSellingPrice)}
                    {isDup && r.existingSellingPrice != null && (
                      <div className="text-xs text-amber-600 dark:text-amber-400">
                        {t('products.import.inDb')}: {formatImportMoney(r.existingSellingPrice)}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {isNew && ed ? (
                      <input
                        type="text"
                        className="w-28 rounded border border-slate-300 px-2 py-1 text-right text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        value={ed.importPrice ?? ''}
                        onChange={(e) => setRowPrice(r.rowNum, e.target.value)}
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {isNew && ed ? (
                      <select
                        value={ed.categoryId ?? ''}
                        onChange={(e) => setRowCategory(r.rowNum, e.target.value)}
                        className="min-w-[8rem] rounded border border-slate-300 px-1 py-1 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="">{t('products.import.noCategory')}</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {isNew && ed ? (
                      <select
                        value={ed.storeId ?? ''}
                        onChange={(e) => setRowStore(r.rowNum, e.target.value)}
                        className="min-w-[8rem] rounded border border-slate-300 px-1 py-1 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="">{t('products.import.noStore')}</option>
                        {stores.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {productImportStatusBadge(r.status, t)}
                    {r.message && !isNew && (
                      <div
                        className={`mt-1 text-xs ${
                          isDup ? 'font-medium text-amber-800 dark:text-amber-200' : 'text-slate-500'
                        }`}
                      >
                        {r.message}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
