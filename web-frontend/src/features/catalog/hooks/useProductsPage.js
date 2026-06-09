import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../store/authStore';
import { invalidateProductCaches } from '../../../utils/productCache';
import { canManageCatalog } from '../constants';
import { useProductsPageCreateFlow } from './products-page/useProductsPageCreateFlow';
import { useProductsPageData } from './products-page/useProductsPageData';
import { useProductsPageFilters } from './products-page/useProductsPageFilters';
import { useProductsPageModals } from './products-page/useProductsPageModals';
import { useProductsPageSelection } from './products-page/useProductsPageSelection';

export function useProductsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const manage = canManageCatalog(user?.role);

  const data = useProductsPageData();
  const filters = useProductsPageFilters({
    setPage: data.setPage,
    setAppliedFilters: data.setAppliedFilters,
  });
  const selection = useProductsPageSelection({
    pageContent: data.pageContent,
    page: data.page,
    search: data.search,
  });
  const createFlow = useProductsPageCreateFlow({ t, activeStores: data.activeStores });
  const modals = useProductsPageModals({ t, selectedIds: selection.selectedIds });

  const invalidateProducts = () => invalidateProductCaches(qc);

  const onCatalogSaved = () => {
    invalidateProducts();
    createFlow.setEditProduct(null);
    createFlow.resetCreateFlow();
  };

  return {
    t,
    navigate,
    manage,
    ...data,
    ...filters,
    ...selection,
    ...createFlow,
    ...modals,
    invalidateProducts,
    onCatalogSaved,
  };
}
