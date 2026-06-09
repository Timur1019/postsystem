import { productFiltersInputCls } from '../../../utils/productFiltersDrawerUi';

export default function ProductFiltersFields({ t, filters, onChange, categories, stores }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div>
        <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
          {t('products.filters.ikpuStatus')}
        </label>
        <select
          className={productFiltersInputCls}
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
        <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
          {t('products.filters.store')}
        </label>
        <select
          className={productFiltersInputCls}
          value={filters.storeId}
          onChange={(e) => set('storeId', e.target.value)}
        >
          <option value="">{t('products.filters.any')}</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
          {t('products.filters.barcode')}
        </label>
        <input
          className={productFiltersInputCls}
          value={filters.barcode}
          onChange={(e) => set('barcode', e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
          {t('products.filters.category')}
        </label>
        <select
          className={productFiltersInputCls}
          value={filters.categoryId}
          onChange={(e) => set('categoryId', e.target.value)}
        >
          <option value="">{t('products.filters.any')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
          {t('products.filters.soldByPiece')}
        </label>
        <select
          className={productFiltersInputCls}
          value={filters.soldIndividually}
          onChange={(e) => set('soldIndividually', e.target.value)}
        >
          <option value="">{t('products.filters.any')}</option>
          <option value="true">{t('products.filters.yes')}</option>
          <option value="false">{t('products.filters.no')}</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
          {t('products.filters.marked')}
        </label>
        <select
          className={productFiltersInputCls}
          value={filters.markedProduct}
          onChange={(e) => set('markedProduct', e.target.value)}
        >
          <option value="">{t('products.filters.any')}</option>
          <option value="true">{t('products.filters.yes')}</option>
          <option value="false">{t('products.filters.no')}</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
          {t('products.filters.deleted')}
        </label>
        <select
          className={productFiltersInputCls}
          value={filters.deletedScope}
          onChange={(e) => set('deletedScope', e.target.value)}
        >
          <option value="ACTIVE">{t('products.filters.notDeleted')}</option>
          <option value="DELETED">{t('products.filters.deletedOnly')}</option>
          <option value="ALL">{t('products.filters.allRecords')}</option>
        </select>
      </div>
    </div>
  );
}
