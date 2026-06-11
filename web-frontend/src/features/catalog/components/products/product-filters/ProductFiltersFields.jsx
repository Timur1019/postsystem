import { BaseSelect } from '../../../../../components/ui';
import { productFiltersInputCls } from '../../../utils/productFiltersDrawerUi';

export default function ProductFiltersFields({ t, filters, onChange, categories, stores }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <BaseSelect
        label={t('products.filters.ikpuStatus')}
        value={filters.ikpuStatus}
        onChange={(e) => set('ikpuStatus', e.target.value)}
        options={[
          { value: 'ALL', label: t('products.filters.ikpuAll') },
          { value: 'UNKNOWN', label: t('products.filters.ikpuUnknown') },
          { value: 'VALID', label: t('products.filters.ikpuValid') },
          { value: 'INVALID', label: t('products.filters.ikpuInvalid') },
        ]}
      />
      <BaseSelect
        label={t('products.filters.store')}
        value={filters.storeId}
        onChange={(e) => set('storeId', e.target.value)}
        placeholder={t('products.filters.any')}
        options={[
          { value: '', label: t('products.filters.any') },
          ...stores.map((s) => ({ value: String(s.id), label: s.name })),
        ]}
      />
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
      <BaseSelect
        label={t('products.filters.category')}
        value={filters.categoryId}
        onChange={(e) => set('categoryId', e.target.value)}
        placeholder={t('products.filters.any')}
        options={[
          { value: '', label: t('products.filters.any') },
          ...categories.map((c) => ({ value: String(c.id), label: c.name })),
        ]}
      />
      <BaseSelect
        label={t('products.filters.soldByPiece')}
        value={filters.soldIndividually}
        onChange={(e) => set('soldIndividually', e.target.value)}
        placeholder={t('products.filters.any')}
        options={[
          { value: '', label: t('products.filters.any') },
          { value: 'true', label: t('products.filters.yes') },
          { value: 'false', label: t('products.filters.no') },
        ]}
      />
      <BaseSelect
        label={t('products.filters.marked')}
        value={filters.markedProduct}
        onChange={(e) => set('markedProduct', e.target.value)}
        placeholder={t('products.filters.any')}
        options={[
          { value: '', label: t('products.filters.any') },
          { value: 'true', label: t('products.filters.yes') },
          { value: 'false', label: t('products.filters.no') },
        ]}
      />
      <BaseSelect
        label={t('products.filters.deleted')}
        value={filters.deletedScope}
        onChange={(e) => set('deletedScope', e.target.value)}
        options={[
          { value: 'ACTIVE', label: t('products.filters.notDeleted') },
          { value: 'DELETED', label: t('products.filters.deletedOnly') },
          { value: 'ALL', label: t('products.filters.allRecords') },
        ]}
      />
    </div>
  );
}
