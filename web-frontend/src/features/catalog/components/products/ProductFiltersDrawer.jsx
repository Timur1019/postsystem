import { useTranslation } from 'react-i18next';
import ProductFiltersDrawerHeader from './product-filters/ProductFiltersDrawerHeader';
import ProductFiltersFields from './product-filters/ProductFiltersFields';
import ProductFiltersDrawerFooter from './product-filters/ProductFiltersDrawerFooter';
import { PRODUCT_FILTERS_SLIDE_IN_STYLE } from '../../utils/productFiltersDrawerUi';

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

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <aside className="relative flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl animate-[slideIn_0.2s_ease-out] dark:border-slate-700 dark:bg-slate-900">
        <style>{PRODUCT_FILTERS_SLIDE_IN_STYLE}</style>
        <ProductFiltersDrawerHeader t={t} onClose={onClose} />
        <ProductFiltersFields
          t={t}
          filters={filters}
          onChange={onChange}
          categories={categories}
          stores={stores}
        />
        <ProductFiltersDrawerFooter t={t} onReset={onReset} onApply={onApply} />
      </aside>
    </div>
  );
}
