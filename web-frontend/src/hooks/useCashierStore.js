import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storeApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useConnectivityStore } from '../store/connectivityStore';

/**
 * Cashier POS store comes only from user.storeIds (assigned in admin).
 * Exactly one store is required for CASHIER role.
 */
export function useCashierStore() {
  const user = useAuthStore((s) => s.user);
  const storeIds = user?.storeIds ?? [];
  const offlineMode = useConnectivityStore((s) => s.offlineMode);
  const localStoreName = useConnectivityStore((s) => s.storeName);

  const assignment = useMemo(() => {
    if (storeIds.length === 0) {
      return { storeId: null, noAssignment: true, multipleAssignment: false };
    }
    if (storeIds.length > 1) {
      return { storeId: null, noAssignment: false, multipleAssignment: true };
    }
    return { storeId: storeIds[0], noAssignment: false, multipleAssignment: false };
  }, [storeIds]);

  const storeId = assignment.storeId;

  const { data: store, isPending, isError } = useQuery({
    queryKey: ['cashier-store', storeId],
    queryFn: () => storeApi.getById(storeId).then((r) => r.data),
    enabled: storeId != null && !offlineMode,
    staleTime: 60_000,
    retry: offlineMode ? false : 2,
  });

  const storeName = store?.name ?? localStoreName ?? null;

  return {
    storeId,
    storeName,
    storeLoading: !offlineMode && isPending && storeId != null,
    storeError: isError,
    noAssignment: assignment.noAssignment,
    multipleAssignment: assignment.multipleAssignment,
    isReady: assignment.storeId != null && !!storeName,
  };
}
