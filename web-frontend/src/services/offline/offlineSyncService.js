import { syncApi } from '../api';
import { isCatalogStoreMismatch } from './connectivityRules';
import {
  offlineGetStatus,
  offlineImportBootstrap,
  offlineListPendingSales,
  offlineMarkSalesSynced,
  isDesktopOfflineBridge,
} from './desktopOfflineBridge';

/** Отправка очереди продаж — часто (лёгкий запрос). */
export const SALES_SYNC_INTERVAL_MS = 60_000;

/** Полный каталог — редко: не чаще этого интервала. */
export const CATALOG_MAX_AGE_MS = 4 * 60 * 60 * 1000;

/** Как часто проверять, не пора ли обновить каталог (без скачивания). */
export const CATALOG_STALE_CHECK_MS = 30 * 60 * 1000;

export function isCatalogStale(lastCatalogSyncAt) {
  if (!lastCatalogSyncAt) return true;
  const ts = Date.parse(lastCatalogSyncAt);
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts >= CATALOG_MAX_AGE_MS;
}

export { isCatalogStoreMismatch } from './connectivityRules';

export async function pullCatalogBootstrap(storeId) {
  const res = await syncApi.bootstrap(storeId);
  const data = res.data;
  if (isDesktopOfflineBridge()) {
    await offlineImportBootstrap(data);
  }
  return data;
}

export async function refreshCatalogBootstrap(storeId, { force = false } = {}) {
  if (!isDesktopOfflineBridge()) return { skipped: true, reason: 'not-desktop' };

  const status = await offlineGetStatus();
  const storeMismatch = isCatalogStoreMismatch(status.storeId, storeId);

  if (!force && !storeMismatch) {
    if (!isCatalogStale(status.lastCatalogSyncAt)) {
      return {
        skipped: true,
        reason: 'fresh',
        lastCatalogSyncAt: status.lastCatalogSyncAt,
      };
    }
  }

  const data = await pullCatalogBootstrap(storeId);
  return {
    skipped: false,
    productCount: data?.products?.length ?? 0,
    syncedAt: data?.syncedAt ?? new Date().toISOString(),
  };
}

export async function pushPendingSales() {
  if (!isDesktopOfflineBridge()) return { pushed: 0, failed: 0, results: [] };

  const pending = await offlineListPendingSales();
  if (!pending.length) return { pushed: 0, failed: 0, results: [] };

  const status = await offlineGetStatus();
  const deviceId = status.deviceId;

  const sales = pending.map((row) => ({
    clientSaleId: row.clientSaleId,
    offlineDeviceId: deviceId,
    createdAt: row.createdAt,
    clientShiftId: row.clientShiftId,
    shiftOpenedAt: row.shiftOpenedAt,
    sale: row.payload,
  }));

  const res = await syncApi.pushSalesBatch({ sales });
  const results = res.data?.results || [];
  await offlineMarkSalesSynced(results);
  const ok = results.filter((r) => r.status === 'CREATED' || r.status === 'ALREADY_EXISTS').length;
  return { pushed: ok, failed: results.length - ok, results };
}

/** Только продажи — для частого фонового цикла. */
export async function runSalesSyncOnly() {
  try {
    return await pushPendingSales();
  } catch {
    return { pushed: 0, failed: 0, results: [] };
  }
}

/** Каталог — только если устарел или force (ручное обновление). */
export async function runCatalogSyncIfNeeded(storeId, { force = false } = {}) {
  try {
    return await refreshCatalogBootstrap(storeId, { force });
  } catch {
    return { skipped: true, reason: 'error' };
  }
}
