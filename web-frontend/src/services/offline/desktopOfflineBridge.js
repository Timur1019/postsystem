/** Desktop offline bridge (Electron IPC). */

const OFFLINE_IPC_TIMEOUT_MS = 6_000;

function withOfflineTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('offline_ipc_timeout')), OFFLINE_IPC_TIMEOUT_MS);
    }),
  ]);
}

export function isDesktopOfflineBridge() {
  return (
    typeof window !== 'undefined' &&
    window.desktopCashier?.isDesktop === true &&
    typeof window.desktopCashier?.offlineGetStatus === 'function'
  );
}

export async function offlineGetStatus() {
  if (!isDesktopOfflineBridge()) {
    return { apiOnline: true, offlineMode: false, canSellOffline: false, bootstrapReady: false };
  }
  return withOfflineTimeout(window.desktopCashier.offlineGetStatus());
}

export async function offlineImportBootstrap(payload) {
  if (!isDesktopOfflineBridge()) return null;
  return withOfflineTimeout(window.desktopCashier.offlineImportBootstrap(payload));
}

export async function offlineListCategories() {
  if (!isDesktopOfflineBridge()) return [];
  return withOfflineTimeout(window.desktopCashier.offlineListCategories());
}

export async function offlineSearchProducts(opts) {
  if (!isDesktopOfflineBridge()) return [];
  return withOfflineTimeout(window.desktopCashier.offlineSearchProducts(opts));
}

export async function offlineGetProductByBarcode(barcode) {
  if (!isDesktopOfflineBridge()) return null;
  return withOfflineTimeout(window.desktopCashier.offlineGetProductByBarcode(barcode));
}

export async function offlineGetCurrentShift(payload) {
  if (!isDesktopOfflineBridge()) return null;
  return withOfflineTimeout(window.desktopCashier.offlineGetCurrentShift(payload));
}

export async function offlineOpenShift(payload) {
  if (!isDesktopOfflineBridge()) return null;
  return withOfflineTimeout(window.desktopCashier.offlineOpenShift(payload));
}

export async function offlineSyncShiftFromServer(payload) {
  if (!isDesktopOfflineBridge()) return null;
  return withOfflineTimeout(window.desktopCashier.offlineSyncShiftFromServer(payload));
}

export async function offlineCloseShift(payload) {
  if (!isDesktopOfflineBridge()) return null;
  return withOfflineTimeout(window.desktopCashier.offlineCloseShift(payload));
}

export async function offlineSaveSale(payload) {
  if (!isDesktopOfflineBridge()) return null;
  return withOfflineTimeout(window.desktopCashier.offlineSaveSale(payload));
}

export async function offlineListPendingSales() {
  if (!isDesktopOfflineBridge()) return [];
  return withOfflineTimeout(window.desktopCashier.offlineListPendingSales());
}

export async function offlineListMySales(opts) {
  if (!isDesktopOfflineBridge()) return [];
  return withOfflineTimeout(window.desktopCashier.offlineListMySales(opts));
}

export async function offlineMarkSalesSynced(results) {
  if (!isDesktopOfflineBridge()) return null;
  return withOfflineTimeout(window.desktopCashier.offlineMarkSalesSynced(results));
}

export async function offlineDecreaseStock(productId, quantity) {
  if (!isDesktopOfflineBridge()) return null;
  return withOfflineTimeout(window.desktopCashier.offlineDecreaseStock({ productId, quantity }));
}

export function subscribeOfflineConnectivity(callback) {
  if (!isDesktopOfflineBridge() || typeof window.desktopCashier.onOfflineConnectivity !== 'function') {
    return () => {};
  }
  return window.desktopCashier.onOfflineConnectivity(callback);
}
