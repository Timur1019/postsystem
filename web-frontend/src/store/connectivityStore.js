import { create } from 'zustand';
import { offlineGetStatus, subscribeOfflineConnectivity } from '../services/offline/desktopOfflineBridge';
import { useAuthStore } from './authStore';
import { userHasCashierOfflineAccess } from '../utils/cashierOfflineAccess';

/** Сразу offline при сбое; online — только после нескольких успешных probe подряд (Windows/Wi‑Fi). */
const ONLINE_RECOVERY_STREAK = 2;
const CONNECTIVITY_POLL_MS = 4_000;
let stableApiOnline = null;
let onlineRecoveryStreak = 0;

function stabilizeApiOnline(rawOnline) {
  if (stableApiOnline === null) {
    stableApiOnline = rawOnline;
    onlineRecoveryStreak = rawOnline ? 1 : 0;
    return stableApiOnline;
  }
  if (!rawOnline) {
    stableApiOnline = false;
    onlineRecoveryStreak = 0;
    return false;
  }
  if (!stableApiOnline) {
    onlineRecoveryStreak += 1;
    if (onlineRecoveryStreak >= ONLINE_RECOVERY_STREAK) {
      stableApiOnline = true;
    }
    return stableApiOnline;
  }
  return true;
}

export function isConnectivityOfflineLike(state) {
  const browserOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  return Boolean(state?.offlineMode || !state?.apiOnline || browserOffline);
}

export function canUseOfflineCheckout(state = useConnectivityStore.getState()) {
  return (
    userHasCashierOfflineAccess(useAuthStore.getState().user) &&
    isConnectivityOfflineLike(state) &&
    Boolean(state.canSellOffline)
  );
}

/** Локальный каталог готов — можно сохранить продажу офлайн при сетевом сбое. */
export function canFallbackToOfflineCheckout(state = useConnectivityStore.getState()) {
  return (
    userHasCashierOfflineAccess(useAuthStore.getState().user) &&
    Boolean(state.canSellOffline)
  );
}

export const useConnectivityStore = create((set, get) => ({
  apiOnline: true,
  offlineMode: false,
  canSellOffline: false,
  bootstrapReady: false,
  pendingSales: 0,
  syncing: false,
  syncingCatalog: false,
  lastSyncAt: null,
  lastCatalogSyncAt: null,
  productCount: 0,
  storeName: null,
  lastSyncError: null,
  deviceId: null,

  applyStatus(status) {
    if (!status) return;
    const prev = get();
    const rawApiOnline =
      status.apiOnline !== undefined ? Boolean(status.apiOnline) : prev.apiOnline;
    const apiOnline = stabilizeApiOnline(rawApiOnline);
    set({
      apiOnline,
      offlineMode: !apiOnline,
      canSellOffline:
        status.canSellOffline !== undefined
          ? Boolean(status.canSellOffline)
          : prev.canSellOffline,
      bootstrapReady:
        status.bootstrapReady !== undefined
          ? Boolean(status.bootstrapReady)
          : prev.bootstrapReady,
      pendingSales:
        status.pendingSales !== undefined
          ? Number(status.pendingSales ?? 0)
          : prev.pendingSales,
      lastCatalogSyncAt:
        status.lastCatalogSyncAt !== undefined
          ? status.lastCatalogSyncAt || null
          : prev.lastCatalogSyncAt,
      productCount:
        status.productCount !== undefined
          ? Number(status.productCount ?? 0)
          : prev.productCount,
      storeName:
        status.storeName !== undefined ? status.storeName || null : prev.storeName,
      deviceId: status.deviceId !== undefined ? status.deviceId || null : prev.deviceId,
    });
  },

  setSyncing(syncing) {
    set({ syncing });
  },

  setSyncingCatalog(syncingCatalog) {
    set({ syncingCatalog });
  },

  setSyncResult({ ok, error } = {}) {
    set({
      syncing: false,
      lastSyncAt: ok ? new Date().toISOString() : get().lastSyncAt,
      lastSyncError: error || null,
    });
  },
}));

let refreshTimer;
let unsubscribeConnectivity;
let browserConnectivityBound;

function applyBrowserOfflineHint() {
  if (typeof navigator === 'undefined' || navigator.onLine) return;
  if (typeof window === 'undefined' || !window.desktopCashier?.isDesktop) return;
  const state = useConnectivityStore.getState();
  if (state.offlineMode && !state.apiOnline) return;
  useConnectivityStore.getState().applyStatus({ apiOnline: false });
}

/** Мгновенно перевести кассу в offline (API probe / axios ещё не успели). */
export function markApiOffline() {
  if (typeof window === 'undefined' || !window.desktopCashier?.isDesktop) return;
  useConnectivityStore.getState().applyStatus({ apiOnline: false });
}

export async function refreshConnectivityStatus() {
  applyBrowserOfflineHint();
  try {
    const status = await offlineGetStatus();
    useConnectivityStore.getState().applyStatus(status);
    return status;
  } catch {
    markApiOffline();
    return null;
  }
}

function onWindowFocusRefreshConnectivity() {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
  refreshConnectivityStatus();
}

export function startConnectivityWatcher() {
  if (refreshTimer) return;
  applyBrowserOfflineHint();
  refreshConnectivityStatus();
  refreshTimer = setInterval(refreshConnectivityStatus, CONNECTIVITY_POLL_MS);
  unsubscribeConnectivity = subscribeOfflineConnectivity((payload) => {
    useConnectivityStore.getState().applyStatus(payload);
  });
  if (!browserConnectivityBound && typeof window !== 'undefined') {
    browserConnectivityBound = true;
    window.addEventListener('online', () => refreshConnectivityStatus());
    window.addEventListener('offline', () => {
      applyBrowserOfflineHint();
      refreshConnectivityStatus();
    });
    window.addEventListener('focus', onWindowFocusRefreshConnectivity);
    document.addEventListener('visibilitychange', onWindowFocusRefreshConnectivity);
  }
}

export function stopConnectivityWatcher() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  if (unsubscribeConnectivity) {
    unsubscribeConnectivity();
    unsubscribeConnectivity = null;
  }
}

export function isOfflinePosMode() {
  return canUseOfflineCheckout();
}

export function userAllowedOfflinePos() {
  return userHasCashierOfflineAccess(useAuthStore.getState().user);
}

export function shouldUseOfflinePos() {
  const { offlineMode, apiOnline } = useConnectivityStore.getState();
  const browserOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  return offlineMode || !apiOnline || browserOffline;
}

export function shouldUseLocalPosCatalog() {
  if (typeof window === 'undefined' || !window.desktopCashier?.isDesktop) return false;
  const state = useConnectivityStore.getState();
  const offlineLike = isConnectivityOfflineLike(state);
  const offlineAllowed = userHasCashierOfflineAccess(useAuthStore.getState().user);
  if (offlineLike && !offlineAllowed) return false;
  if (state.bootstrapReady) return true;
  return offlineLike;
}

export function useShouldUseOfflinePos() {
  const user = useAuthStore((s) => s.user);
  const apiOnline = useConnectivityStore((s) => s.apiOnline);
  const offlineMode = useConnectivityStore((s) => s.offlineMode);
  if (typeof window === 'undefined' || !window.desktopCashier?.isDesktop) return false;
  const browserOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  const offlineLike = offlineMode || !apiOnline || browserOffline;
  if (offlineLike && !userHasCashierOfflineAccess(user)) return false;
  return offlineLike;
}

export function useShouldUseLocalPosCatalog() {
  const user = useAuthStore((s) => s.user);
  const bootstrapReady = useConnectivityStore((s) => s.bootstrapReady);
  const apiOnline = useConnectivityStore((s) => s.apiOnline);
  const offlineMode = useConnectivityStore((s) => s.offlineMode);
  if (typeof window === 'undefined' || !window.desktopCashier?.isDesktop) return false;
  const browserOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  const offlineLike = offlineMode || !apiOnline || browserOffline;
  if (offlineLike && !userHasCashierOfflineAccess(user)) return false;
  if (bootstrapReady) return true;
  return offlineLike;
}
