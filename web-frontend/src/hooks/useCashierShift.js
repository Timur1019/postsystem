import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cashierShiftApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useConnectivityStore } from '../store/connectivityStore';
import {
  isDesktopOfflineBridge,
  offlineGetCurrentShift,
  offlineOpenShift,
} from '../services/offline/desktopOfflineBridge';

function shiftQueryKey(storeId, userId, offlineShift) {
  return ['cashier-shift', storeId, userId, offlineShift ? 'offline' : 'online'];
}

/** Текущая открытая смена из БД; null — смена не открыта. */
export async function fetchCurrentCashierShift(storeId, user, offlineShift = false) {
  if (offlineShift) {
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
  const offlineMode = useConnectivityStore((s) => s.offlineMode);
  const offlineShift = isDesktopOfflineBridge() && offlineMode;

  return useQuery({
    queryKey: shiftQueryKey(storeId, userId, offlineShift),
    queryFn: () => fetchCurrentCashierShift(storeId, user, offlineShift),
    enabled: storeId != null && userId != null,
    retry: offlineShift ? false : 1,
    staleTime: 5_000,
    refetchOnWindowFocus: false,
  });
}

/** Открыть смену (POST /open; если уже открыта — GET /current). */
export async function openCashierShift(storeId, user, offlineShift = false, storeName = '') {
  if (offlineShift) {
    return offlineOpenShift({
      storeId,
      cashierId: user?.id,
      cashierName: user?.fullName || user?.username || '',
      storeName,
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
  const offlineMode = useConnectivityStore((s) => s.offlineMode);
  const localStoreName = useConnectivityStore((s) => s.storeName);
  const offlineShift = isDesktopOfflineBridge() && offlineMode;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => openCashierShift(storeId, user, offlineShift, localStoreName || ''),
    onSuccess: (data) => {
      qc.setQueryData(shiftQueryKey(storeId, userId, offlineShift), data);
    },
  });
}

export { shiftQueryKey };
