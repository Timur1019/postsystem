import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cashierShiftApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useConnectivityStore } from '../store/connectivityStore';
import {
  offlineGetCurrentShift,
  offlineOpenShift,
} from '../services/offline/desktopOfflineBridge';

/** Текущая открытая смена из БД; null — смена не открыта. */
export async function fetchCurrentCashierShift(storeId, user, offlinePos = false) {
  if (offlinePos) {
    if (!user?.id) return null;
    return offlineGetCurrentShift({ storeId, cashierId: user.id });
  }
  try {
    const res = await cashierShiftApi.current(storeId);
    return res.data;
  } catch (e) {
    if (e.response?.status === 404) return null;
    throw e;
  }
}

export function useCashierShift(storeId) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const offlinePos = useConnectivityStore((s) => s.offlineMode && s.canSellOffline);

  return useQuery({
    queryKey: ['cashier-shift', storeId, userId, offlinePos ? 'offline' : 'online'],
    queryFn: () => fetchCurrentCashierShift(storeId, user, offlinePos),
    enabled: storeId != null && userId != null,
    retry: false,
    staleTime: 5_000,
    refetchOnWindowFocus: false,
  });
}

/** Открыть смену (POST /open; если уже открыта — GET /current). */
export async function openCashierShift(storeId, user, offlinePos = false) {
  if (offlinePos) {
    return offlineOpenShift({
      storeId,
      cashierId: user?.id,
      cashierName: user?.fullName || user?.username || '',
    });
  }
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
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const offlinePos = useConnectivityStore((s) => s.offlineMode && s.canSellOffline);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => openCashierShift(storeId, user, offlinePos),
    onSuccess: (data) => {
      qc.setQueryData(['cashier-shift', storeId, userId, offlinePos ? 'offline' : 'online'], data);
    },
  });
}
