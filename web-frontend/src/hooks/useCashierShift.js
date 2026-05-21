import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cashierShiftApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

/** Текущая открытая смена из БД; null — смена не открыта. */
export async function fetchCurrentCashierShift(storeId) {
  try {
    const res = await cashierShiftApi.current(storeId);
    return res.data;
  } catch (e) {
    if (e.response?.status === 404) return null;
    throw e;
  }
}

export function useCashierShift(storeId) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['cashier-shift', storeId, userId],
    queryFn: () => fetchCurrentCashierShift(storeId),
    enabled: storeId != null && userId != null,
    retry: false,
    staleTime: 5_000,
    refetchOnWindowFocus: false,
  });
}

/** Открыть смену (POST /open; если уже открыта — GET /current). */
export async function openCashierShift(storeId) {
  try {
    const res = await cashierShiftApi.open(storeId);
    return res.data;
  } catch (e) {
    const msg = String(e.response?.data?.message ?? '');
    if (e.response?.status === 400 && /открыта/i.test(msg)) {
      const res = await cashierShiftApi.current(storeId);
      return res.data;
    }
    throw e;
  }
}

export function useOpenCashierShift(storeId) {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => openCashierShift(storeId),
    onSuccess: (data) => {
      qc.setQueryData(['cashier-shift', storeId, userId], data);
    },
  });
}
