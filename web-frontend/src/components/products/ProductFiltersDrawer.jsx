// src/components/products/ProductFiltersDrawer.jsx
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const inputCls = `w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500
                  dark:border-slate-700 dark:bg-slate-800 dark:text-white`;

export default function ProductFiltersDrawer({
  open,
  onClose,
  filters,
  onChange,
  onApply,
  onReset,
  categories,
  stores,
}) {
  const { t } = useTranslation();
  if (!open) return null;

  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <aside className="relative flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl animate-[slideIn_0.2s_ease-out] dark:border-slate-700 dark:bg-slate-900">
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">{t('products.filters.title')}</h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">{t('products.filters.ikpuStatus')}</label>
            <select
              className={inputCls}
              value={filters.ikpuStatus}
              onChange={(e) => set('ikpuStatus', e.target.value)}
            >
              <option value="ALL">{t('products.filters.ikpuAll')}</option>
              <option value="UNKNOWN">{t('products.filters.ikpuUnknown')}</option>
              <option value="VALID">{t('products.filters.ikpuValid')}</option>
              <option value="INVALID">{t('products.filters.ikpuInvalid')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">{t('products.filters.store')}</label>
            <select
              className={inputCls}
              value={filters.storeId}
              onChange={(e) => set('storeId', e.target.value)}
            >
              <option value="">{t('products.filters.any')}</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">{t('products.filters.barcode')}</label>
            <input
              className={inputCls}
              value={filters.barcode}
              onChange={(e) => set('barcode', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">{t('products.filters.category')}</label>
            <select
              className={inputCls}
              value={filters.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
            >
              <option value="">{t('products.filters.any')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">{t('products.filters.soldByPiece')}</label>
            <select
              className={inputCls}
              value={filters.soldIndividually}
              onChange={(e) => set('soldIndividually', e.target.value)}
            >
              <option value="">{t('products.filters.any')}</option>
              <option value="true">{t('products.filters.yes')}</option>
              <option value="false">{t('products.filters.no')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">{t('products.filters.marked')}</label>
            <select
              className={inputCls}
              value={filters.markedProduct}
              onChange={(e) => set('markedProduct', e.target.value)}
            >
              <option value="">{t('products.filters.any')}</option>
              <option value="true">{t('products.filters.yes')}</option>
              <option value="false">{t('products.filters.no')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">{t('products.filters.deleted')}</label>
            <select
              className={inputCls}
              value={filters.deletedScope}
              onChange={(e) => set('deletedScope', e.target.value)}
            >
              <option value="ACTIVE">{t('products.filters.notDeleted')}</option>
              <option value="DELETED">{t('products.filters.deletedOnly')}</option>
              <option value="ALL">{t('products.filters.allRecords')}</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t('products.filters.reset')}
          </button>
          <button
            type="button"
            onClick={onApply}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            {t('common.apply')}
          </button>
        </div>
      </aside>
    </div>
  );
}
