import { create } from 'zustand';
import { offlineGetStatus, subscribeOfflineConnectivity } from '../services/offline/desktopOfflineBridge';

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
    set({
      apiOnline: Boolean(status.apiOnline),
      offlineMode: Boolean(status.offlineMode),
      canSellOffline: Boolean(status.canSellOffline),
      bootstrapReady: Boolean(status.bootstrapReady),
      pendingSales: Number(status.pendingSales ?? 0),
      lastCatalogSyncAt: status.lastCatalogSyncAt || null,
      productCount: Number(status.productCount ?? 0),
      storeName: status.storeName || null,
      deviceId: status.deviceId || null,
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
  useConnectivityStore.getState().applyStatus({
    ...state,
    apiOnline: false,
    offlineMode: true,
  });
}

export async function refreshConnectivityStatus() {
  applyBrowserOfflineHint();
  try {
    const status = await offlineGetStatus();
    useConnectivityStore.getState().applyStatus(status);
    return status;
  } catch {
    useConnectivityStore.getState().applyStatus({
      apiOnline: false,
      offlineMode: true,
      canSellOffline: false,
    });
    return null;
  }
}

export function startConnectivityWatcher() {
  if (refreshTimer) return;
  applyBrowserOfflineHint();
  refreshConnectivityStatus();
  refreshTimer = setInterval(refreshConnectivityStatus, 12_000);
  unsubscribeConnectivity = subscribeOfflineConnectivity((payload) => {
    useConnectivityStore.getState().applyStatus(payload);
  });
  if (!browserConnectivityBound && typeof window !== 'undefined') {
    browserConnectivityBound = true;
    window.addEventListener('online', () => refreshConnectivityStatus());
    window.addEventListener('offline', applyBrowserOfflineHint);
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
  const { offlineMode, canSellOffline } = useConnectivityStore.getState();
  return offlineMode && canSellOffline;
}

export function shouldUseOfflinePos() {
  const { offlineMode, apiOnline } = useConnectivityStore.getState();
  const browserOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  return offlineMode || !apiOnline || browserOffline;
}

export function shouldUseLocalPosCatalog() {
  if (typeof window === 'undefined' || !window.desktopCashier?.isDesktop) return false;
  const { offlineMode, apiOnline, bootstrapReady } = useConnectivityStore.getState();
  const browserOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  return offlineMode || !apiOnline || bootstrapReady || browserOffline;
}

export function useShouldUseOfflinePos() {
  const apiOnline = useConnectivityStore((s) => s.apiOnline);
  const offlineMode = useConnectivityStore((s) => s.offlineMode);
  if (typeof window === 'undefined' || !window.desktopCashier?.isDesktop) return false;
  const browserOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  return offlineMode || !apiOnline || browserOffline;
}

export function useShouldUseLocalPosCatalog() {
  const apiOnline = useConnectivityStore((s) => s.apiOnline);
  const offlineMode = useConnectivityStore((s) => s.offlineMode);
  const bootstrapReady = useConnectivityStore((s) => s.bootstrapReady);
  if (typeof window === 'undefined' || !window.desktopCashier?.isDesktop) return false;
  const browserOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  return offlineMode || !apiOnline || bootstrapReady || browserOffline;
}
