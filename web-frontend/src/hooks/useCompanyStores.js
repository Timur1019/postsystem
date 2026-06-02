import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storeApi } from '../services/api';
import { useTenantScope } from './useTenantScope';

/**
 * Company stores for stock operations.
 * - one store: auto-selected, no picker needed
 * - several: user must pick storeId
 */
export function useCompanyStores() {
  const { companyId, tenantKey, tenantReady } = useTenantScope();

  const { data: stores = [], isPending, isError } = useQuery({
    queryKey: tenantKey('stores'),
    queryFn: () => storeApi.getAll().then((r) => r.data),
    staleTime: 60_000,
    enabled: tenantReady,
  });

  const onlyStore = useMemo(() => (stores.length === 1 ? stores[0] : null), [stores]);
  const needsStorePick = stores.length > 1;

  const resolveStoreId = (selected) => {
    if (selected != null && selected !== '') return Number(selected);
    if (onlyStore) return onlyStore.id;
    return null;
  };

  return { stores, onlyStore, needsStorePick, resolveStoreId, isPending, isError, companyId };
}
