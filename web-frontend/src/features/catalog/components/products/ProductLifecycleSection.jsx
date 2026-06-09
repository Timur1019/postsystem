import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '../../../../utils/apiError';
import { useProductLifecycleSection } from '../../hooks/useProductLifecycleSection';
import ProductLifecycleSummaryGrid from './product-lifecycle/ProductLifecycleSummaryGrid';
import ProductLifecycleFilters from './product-lifecycle/ProductLifecycleFilters';
import ProductLifecycleEventsTable from './product-lifecycle/ProductLifecycleEventsTable';

export default function ProductLifecycleSection({ productId, showStoreFilter = false }) {
  const { t } = useTranslation();
  const p = useProductLifecycleSection(productId, showStoreFilter);

  return (
    <div className="space-y-4">
      <ProductLifecycleSummaryGrid t={t} summary={p.summary} />

      <ProductLifecycleFilters
        t={t}
        from={p.from}
        to={p.to}
        onFromChange={p.handleFromChange}
        onToChange={p.handleToChange}
        movementType={p.movementType}
        onMovementTypeChange={p.handleMovementTypeChange}
        showStoreFilter={showStoreFilter}
        storeId={p.storeId}
        onStoreChange={p.handleStoreChange}
        stores={p.stores}
      />

      {p.isError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {getApiErrorMessage(p.error, t('products.lifecycle.loadFail'))}
        </p>
      )}

      <ProductLifecycleEventsTable
        t={t}
        rows={p.rows}
        isPending={p.isPending}
        page={p.page}
        pageSize={p.pageSize}
        total={p.total}
        totalPages={p.totalPages}
        onPageChange={p.setPage}
        onPageSizeChange={p.setPageSize}
      />
    </div>
  );
}
