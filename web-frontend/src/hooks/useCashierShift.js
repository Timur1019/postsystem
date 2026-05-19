import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cashierShiftApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  isCashierShiftUiActive,
  isCashierShiftUiClosed,
  setCashierShiftUiActive,
  setCashierShiftUiClosed,
} from '../utils/cashierShiftUi';

/** Текущая открытая смена; null — смена не открыта в UI. */
export async function fetchCurrentCashierShift(storeId, userId) {
  if (isCashierShiftUiClosed(storeId, userId)) return null;
  if (!isCashierShiftUiActive(storeId, userId)) return null;
  const res = await cashierShiftApi.current(storeId);
  return res.data;
}

export function useCashierShift(storeId) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['cashier-shift', storeId, userId],
    queryFn: () => fetchCurrentCashierShift(storeId, userId),
    enabled: storeId != null && userId != null,
    retry: false,
  });
}

/** Открыть смену (POST /open; если уже открыта в БД — GET /current). */
export async function openCashierShift(storeId, userId) {
  setCashierShiftUiClosed(storeId, userId, false);
  setCashierShiftUiActive(storeId, userId, true);
  try {
    const res = await cashierShiftApi.open(storeId);
    return res.data;
  } catch (e) {
    const msg = String(e.response?.data?.message ?? '');
    if (e.response?.status === 400 && /открыта/i.test(msg)) {
      const res = await cashierShiftApi.current(storeId);
      return res.data;
    }
    setCashierShiftUiActive(storeId, userId, false);
    throw e;
  }
}

export function useOpenCashierShift(storeId) {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => openCashierShift(storeId, userId),
    onSuccess: (data) => {
      qc.setQueryData(['cashier-shift', storeId, userId], data);
    },
  });
}
