import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { cashierShiftApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useConnectivityStore, useShouldUseOfflinePos } from '../store/connectivityStore';
import {
  isDesktopOfflineBridge,
  offlineGetCurrentShift,
  offlineOpenShift,
  offlineSyncShiftFromServer,
} from '../services/offline/desktopOfflineBridge';
import { isApiNetworkError } from '../utils/apiNetworkError';
import { canFallbackToOfflineCheckout } from '../store/connectivityStore';

function shiftQueryKey(storeId, userId, offlineShift) {
  return ['cashier-shift', storeId, userId, offlineShift ? 'offline' : 'online'];
}

function shiftMirrorPayload(shift, storeId, user, storeName) {
  return {
    shift,
    storeId,
    cashierId: user?.id,
    cashierName: user?.fullName || user?.username || '',
    storeName: storeName || shift?.storeName || '',
  };
}

async function mirrorOnlineShiftToLocal(shift, storeId, user, storeName) {
  if (!isDesktopOfflineBridge() || !shift || shift.status !== 'OPEN' || !user?.id) return;
  try {
    await offlineSyncShiftFromServer(shiftMirrorPayload(shift, storeId, user, storeName));
  } catch {
    // non-blocking
  }
}

/** Текущая открытая смена из БД; null — смена не открыта. */
export async function fetchCurrentCashierShift(storeId, user, offlineShift = false, storeName = '') {
  if (offlineShift) {
    if (!user?.id) return null;
    return offlineGetCurrentShift({ storeId, cashierId: user.id });
  }
  try {
    const res = await cashierShiftApi.current(storeId);
    const shift = res.data;
    await mirrorOnlineShiftToLocal(shift, storeId, user, storeName);
    return shift;
  } catch (e) {
    if (e.response?.status === 404) return null;
    if (
      isApiNetworkError(e) &&
      isDesktopOfflineBridge() &&
      canFallbackToOfflineCheckout() &&
      user?.id
    ) {
      return offlineGetCurrentShift({ storeId, cashierId: user.id });
    }
    throw e;
  }
}

export function useCashierShift(storeId) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const localStoreName = useConnectivityStore((s) => s.storeName);
  const offlineShift = useShouldUseOfflinePos();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: shiftQueryKey(storeId, userId, offlineShift),
    queryFn: () =>
      fetchCurrentCashierShift(storeId, user, offlineShift, localStoreName || ''),
    enabled: storeId != null && userId != null,
    retry: offlineShift ? false : 1,
    staleTime: 5_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (offlineShift || !query.data || query.data.status !== 'OPEN') return;
    mirrorOnlineShiftToLocal(query.data, storeId, user, localStoreName || '');
  }, [query.data, storeId, user, userId, offlineShift, localStoreName]);

  useEffect(() => {
    if (!isDesktopOfflineBridge() || !storeId) return undefined;
    let prevApiOnline = useConnectivityStore.getState().apiOnline;
    const unsub = useConnectivityStore.subscribe((state) => {
      if (state.apiOnline !== prevApiOnline) {
        qc.invalidateQueries({ queryKey: ['cashier-shift', storeId] });
        prevApiOnline = state.apiOnline;
      }
    });
    return unsub;
  }, [storeId, qc]);

  return query;
}

/** Открыть смену (POST /open; если уже открыта — GET /current). */
export async function openCashierShift(storeId, user, offlineShift = false, storeName = '') {
  if (offlineShift) {
    const shift = await offlineOpenShift({
      storeId,
      cashierId: user?.id,
      cashierName: user?.fullName || user?.username || '',
      storeName,
    });
    if (!shift) {
      throw new Error('OFFLINE_SHIFT_OPEN_FAILED');
    }
    return shift;
  }
  try {
    const res = await cashierShiftApi.open(storeId);
    await mirrorOnlineShiftToLocal(res.data, storeId, user, storeName);
    return res.data;
  } catch (e) {
    const msg = String(e.response?.data?.message ?? '');
    if (e.response?.status === 400 && /открыта/i.test(msg)) {
      const res = await cashierShiftApi.current(storeId);
      await mirrorOnlineShiftToLocal(res.data, storeId, user, storeName);
      return res.data;
    }
    if (
      isApiNetworkError(e) &&
      isDesktopOfflineBridge() &&
      canFallbackToOfflineCheckout() &&
      user?.id
    ) {
      const shift = await offlineOpenShift({
        storeId,
        cashierId: user.id,
        cashierName: user?.fullName || user?.username || '',
        storeName,
      });
      if (!shift) throw new Error('OFFLINE_SHIFT_OPEN_FAILED');
      return shift;
    }
    throw e;
  }
}

export function useOpenCashierShift(storeId) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const localStoreName = useConnectivityStore((s) => s.storeName);
  const offlineShift = useShouldUseOfflinePos();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => openCashierShift(storeId, user, offlineShift, localStoreName || ''),
    onSuccess: (data) => {
      qc.setQueryData(shiftQueryKey(storeId, userId, offlineShift), data);
    },
  });
}

export { shiftQueryKey };
