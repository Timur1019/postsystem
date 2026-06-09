import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cashierShiftApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  useConnectivityStore,
  useShouldUseOfflinePos,
  shouldUseOfflinePos,
  canFallbackToOfflineCheckout,
} from '../store/connectivityStore';
import {
  isDesktopOfflineBridge,
  offlineCloseShift,
  offlineGetCurrentShift,
  offlineOpenShift,
  offlineSyncShiftFromServer,
} from '../services/offline/desktopOfflineBridge';
import { isApiUnreachableError } from '../utils/apiNetworkError';

function shiftQueryKey(storeId, userId) {
  return ['cashier-shift', storeId, userId];
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

async function mirrorCloseShiftToLocal(storeId, user) {
  if (!isDesktopOfflineBridge() || !user?.id || !storeId) return;
  try {
    await offlineCloseShift({ storeId, cashierId: user.id });
  } catch {
    // non-blocking
  }
}

async function mirrorOnlineShiftToLocal(shift, storeId, user, storeName) {
  if (!isDesktopOfflineBridge() || !shift || shift.status !== 'OPEN' || !user?.id) return;
  try {
    await offlineSyncShiftFromServer(shiftMirrorPayload(shift, storeId, user, storeName));
  } catch {
    // non-blocking
  }
}

/** Текущая открытая смена; null — смена не открыта. */
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
    if (e.response?.status === 404) {
      await mirrorCloseShiftToLocal(storeId, user);
      return null;
    }
    if (
      isApiUnreachableError(e) &&
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
    queryKey: shiftQueryKey(storeId, userId),
    queryFn: () =>
      fetchCurrentCashierShift(
        storeId,
        user,
        shouldUseOfflinePos(),
        localStoreName || '',
      ),
    enabled: storeId != null && userId != null,
    retry: offlineShift ? false : 1,
    staleTime: 5_000,
    refetchOnWindowFocus: false,
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
        qc.invalidateQueries({ queryKey: shiftQueryKey(storeId, userId) });
        prevApiOnline = state.apiOnline;
      }
    });
    return unsub;
  }, [storeId, userId, qc]);

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
      isApiUnreachableError(e) &&
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

/** Закрыть смену на сервере и в локальной SQLite (desktop). */
export async function closeCashierShift(shiftId, storeId, user) {
  const closedShift = await cashierShiftApi.close(shiftId).then((r) => r.data);
  await mirrorCloseShiftToLocal(storeId, user);
  return closedShift;
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
      qc.setQueryData(shiftQueryKey(storeId, userId), data);
    },
  });
}

export function useCloseCashierShift(storeId) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (shiftId) => closeCashierShift(shiftId, storeId, user),
    onSuccess: (closedShift) => {
      qc.setQueryData(shiftQueryKey(storeId, userId), null);
      qc.invalidateQueries({ queryKey: ['z-reports'] });
      qc.invalidateQueries({ queryKey: ['my-sales'] });
      return closedShift;
    },
  });
}

export { shiftQueryKey, mirrorCloseShiftToLocal };
