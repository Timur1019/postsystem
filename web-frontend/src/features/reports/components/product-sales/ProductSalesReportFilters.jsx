import { Search } from 'lucide-react';
import { BaseSelect, inputCls } from '../../../../components/ui';
import ReportDateBar from '../../../../components/shared/ReportDateBar';
import ReportStoreSelect from '../ReportStoreSelect';

export default function ProductSalesReportFilters({
  t,
  from,
  to,
  onFrom,
  onTo,
  search,
  onSearchChange,
  stores,
  storeId,
  onStoreChange,
  categoryId,
  onCategoryChange,
  categories,
}) {
  return (
    <>
      <ReportDateBar from={from} to={to} onFrom={onFrom} onTo={onTo} />
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[12rem] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('common.search')}
            className={inputCls + ' py-2 pl-9 pr-3'}
          />
        </div>
        <ReportStoreSelect stores={stores} value={storeId} onChange={onStoreChange} />
        <BaseSelect
          value={categoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-auto min-w-[10rem]"
          placeholder={t('stockReports.allCategories')}
          options={[
            { value: '', label: t('stockReports.allCategories') },
            ...categories.map((c) => ({ value: String(c.id), label: c.name })),
          ]}
        />
      </div>
    </>
  );
}
