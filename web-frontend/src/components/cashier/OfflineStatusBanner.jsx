import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { CloudOff, RefreshCw, Wifi } from 'lucide-react';
import { useCashierStore } from '../../hooks/useCashierStore';
import { useConnectivityStore, refreshConnectivityStatus } from '../../store/connectivityStore';
import {
  pushPendingSales,
  refreshCatalogBootstrap,
} from '../../services/offline/offlineSyncService';
import { isDesktopOfflineBridge } from '../../services/offline/desktopOfflineBridge';

function formatCatalogSyncAt(iso) {
  if (!iso) return null;
  try {
    return format(new Date(iso), 'dd.MM.yyyy HH:mm');
  } catch {
    return iso;
  }
}

export default function OfflineStatusBanner() {
  const { t } = useTranslation();
  const { storeId } = useCashierStore();
  const offlineMode = useConnectivityStore((s) => s.offlineMode);
  const canSellOffline = useConnectivityStore((s) => s.canSellOffline);
  const pendingSales = useConnectivityStore((s) => s.pendingSales);
  const syncing = useConnectivityStore((s) => s.syncing);
  const syncingCatalog = useConnectivityStore((s) => s.syncingCatalog);
  const apiOnline = useConnectivityStore((s) => s.apiOnline);
  const bootstrapReady = useConnectivityStore((s) => s.bootstrapReady);
  const lastCatalogSyncAt = useConnectivityStore((s) => s.lastCatalogSyncAt);
  const productCount = useConnectivityStore((s) => s.productCount);

  if (!isDesktopOfflineBridge()) return null;

  const showOffline = offlineMode;
  const showPending = apiOnline && pendingSales > 0;
  const catalogLabel = formatCatalogSyncAt(lastCatalogSyncAt);
  const showCatalogStrip = apiOnline && bootstrapReady && !showOffline;

  if (!showOffline && !showPending && !showCatalogStrip && !(apiOnline && !bootstrapReady)) {
    return null;
  }

  const handleSyncSales = async () => {
    useConnectivityStore.getState().setSyncing(true);
    try {
      await pushPendingSales();
      useConnectivityStore.getState().setSyncResult({ ok: true });
      await refreshConnectivityStatus();
    } catch (err) {
      useConnectivityStore.getState().setSyncResult({
        ok: false,
        error: err?.message || String(err),
      });
    }
  };

  const handleRefreshCatalog = async () => {
    if (!storeId) return;
    useConnectivityStore.getState().setSyncingCatalog(true);
    try {
      await refreshCatalogBootstrap(storeId, { force: true });
      useConnectivityStore.getState().setSyncResult({ ok: true });
      await refreshConnectivityStatus();
    } catch (err) {
      useConnectivityStore.getState().setSyncResult({
        ok: false,
        error: err?.message || String(err),
      });
    } finally {
      useConnectivityStore.getState().setSyncingCatalog(false);
    }
  };

  let message = t('offline.onlineOk');
  let tone = 'offline-banner--ok';

  if (showOffline && !canSellOffline) {
    message = t('offline.noCatalog');
    tone = 'offline-banner--warn';
  } else if (showOffline) {
    message = t('offline.workingOffline');
    tone = 'offline-banner--offline';
  } else if (showPending) {
    message = t('offline.pendingSales', { count: pendingSales });
    tone = 'offline-banner--pending';
  } else if (!bootstrapReady && apiOnline) {
    message = t('offline.preparingCatalog');
  } else if (showCatalogStrip && catalogLabel) {
    message = t('offline.catalogFresh', {
      date: catalogLabel,
      count: productCount,
    });
  }

  return (
    <div className={`offline-banner ${tone}`} role="status">
      <span className="offline-banner__icon">
        {showOffline ? <CloudOff size={16} aria-hidden /> : <Wifi size={16} aria-hidden />}
      </span>
      <span className="offline-banner__text">{message}</span>
      <div className="offline-banner__actions">
        {showPending && apiOnline ? (
          <button
            type="button"
            className="offline-banner__action btn btn-sm btn-outline-light"
            disabled={syncing}
            onClick={handleSyncSales}
          >
            <RefreshCw size={14} className={syncing ? 'spin' : ''} aria-hidden />
            {syncing ? t('offline.syncing') : t('offline.syncSales')}
          </button>
        ) : null}
        {apiOnline && !showOffline ? (
          <button
            type="button"
            className="offline-banner__action btn btn-sm btn-outline-light"
            disabled={syncingCatalog}
            onClick={handleRefreshCatalog}
          >
            <RefreshCw size={14} className={syncingCatalog ? 'spin' : ''} aria-hidden />
            {syncingCatalog ? t('offline.updatingCatalog') : t('offline.updateCatalog')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
