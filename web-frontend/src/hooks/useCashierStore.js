import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storeApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

/**
 * Cashier POS store comes only from user.storeIds (assigned in admin).
 * Exactly one store is required for CASHIER role.
 */
export function useCashierStore() {
  const user = useAuthStore((s) => s.user);
  const storeIds = user?.storeIds ?? [];

  const assignment = useMemo(() => {
    if (storeIds.length === 0) {
      return { storeId: null, noAssignment: true, multipleAssignment: false };
    }
    if (storeIds.length > 1) {
      return { storeId: null, noAssignment: false, multipleAssignment: true };
    }
    return { storeId: storeIds[0], noAssignment: false, multipleAssignment: false };
  }, [storeIds]);

  const { data: stores, isPending } = useQuery({
    queryKey: ['cashier-stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
    enabled: assignment.storeId != null,
    staleTime: 60_000,
  });

  const store = stores?.find((s) => s.id === assignment.storeId);

  return {
    storeId: assignment.storeId,
    storeName: store?.name ?? null,
    storeLoading: isPending && assignment.storeId != null,
    noAssignment: assignment.noAssignment,
    multipleAssignment: assignment.multipleAssignment,
    isReady: assignment.storeId != null && !!store?.name,
  };
}
