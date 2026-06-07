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

export async function refreshConnectivityStatus() {
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
  refreshConnectivityStatus();
  refreshTimer = setInterval(refreshConnectivityStatus, 12_000);
  unsubscribeConnectivity = subscribeOfflineConnectivity((payload) => {
    useConnectivityStore.getState().applyStatus(payload);
  });
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

export function shouldUseOfflineApi() {
  return useConnectivityStore.getState().offlineMode;
}
