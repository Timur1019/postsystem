import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCashierStore } from './useCashierStore';
import {
  refreshConnectivityStatus,
  startConnectivityWatcher,
  stopConnectivityWatcher,
  useConnectivityStore,
} from '../store/connectivityStore';
import {
  CATALOG_STALE_CHECK_MS,
  SALES_SYNC_INTERVAL_MS,
  runCatalogSyncIfNeeded,
  runSalesSyncOnly,
} from '../services/offline/offlineSyncService';
import { isDesktopOfflineBridge } from '../services/offline/desktopOfflineBridge';

export function useOfflineConnectivity() {
  const token = useAuthStore((s) => s.token);
  const { storeId } = useCashierStore();
  const apiOnline = useConnectivityStore((s) => s.apiOnline);
  const offlineMode = useConnectivityStore((s) => s.offlineMode);
  const pendingSales = useConnectivityStore((s) => s.pendingSales);
  const syncing = useConnectivityStore((s) => s.syncing);
  const canSellOffline = useConnectivityStore((s) => s.canSellOffline);
  const bootstrapReady = useConnectivityStore((s) => s.bootstrapReady);

  useEffect(() => {
    if (!isDesktopOfflineBridge()) return undefined;
    startConnectivityWatcher();
    return () => stopConnectivityWatcher();
  }, []);

  useEffect(() => {
    if (!isDesktopOfflineBridge() || !token || !storeId || !apiOnline) return undefined;

    let cancelled = false;

    const runInitialSync = async () => {
      useConnectivityStore.getState().setSyncing(true);
      try {
        await runCatalogSyncIfNeeded(storeId, { force: false });
        await runSalesSyncOnly();
        if (!cancelled) {
          useConnectivityStore.getState().setSyncResult({ ok: true });
          await refreshConnectivityStatus();
        }
      } catch (err) {
        if (!cancelled) {
          useConnectivityStore.getState().setSyncResult({
            ok: false,
            error: err?.message || String(err),
          });
        }
      }
    };

    runInitialSync();

    const salesTimer = setInterval(async () => {
      if (cancelled) return;
      try {
        await runSalesSyncOnly();
        await refreshConnectivityStatus();
      } catch {
        /* retry next tick */
      }
    }, SALES_SYNC_INTERVAL_MS);

    const catalogTimer = setInterval(async () => {
      if (cancelled) return;
      try {
        const result = await runCatalogSyncIfNeeded(storeId, { force: false });
        if (!result?.skipped) {
          await refreshConnectivityStatus();
        }
      } catch {
        /* retry on next check */
      }
    }, CATALOG_STALE_CHECK_MS);

    return () => {
      cancelled = true;
      clearInterval(salesTimer);
      clearInterval(catalogTimer);
    };
  }, [token, storeId, apiOnline]);

  return {
    apiOnline,
    offlineMode,
    pendingSales,
    syncing,
    canSellOffline,
    bootstrapReady,
  };
}
