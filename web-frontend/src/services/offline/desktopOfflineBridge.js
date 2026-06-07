/** Desktop offline bridge (Electron IPC). */

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
  return window.desktopCashier.offlineGetStatus();
}

export async function offlineImportBootstrap(payload) {
  if (!isDesktopOfflineBridge()) return null;
  return window.desktopCashier.offlineImportBootstrap(payload);
}

export async function offlineListCategories() {
  if (!isDesktopOfflineBridge()) return [];
  return window.desktopCashier.offlineListCategories();
}

export async function offlineSearchProducts(opts) {
  if (!isDesktopOfflineBridge()) return [];
  return window.desktopCashier.offlineSearchProducts(opts);
}

export async function offlineGetProductByBarcode(barcode) {
  if (!isDesktopOfflineBridge()) return null;
  return window.desktopCashier.offlineGetProductByBarcode(barcode);
}

export async function offlineGetCurrentShift(payload) {
  if (!isDesktopOfflineBridge()) return null;
  return window.desktopCashier.offlineGetCurrentShift(payload);
}

export async function offlineOpenShift(payload) {
  if (!isDesktopOfflineBridge()) return null;
  return window.desktopCashier.offlineOpenShift(payload);
}

export async function offlineSaveSale(payload) {
  if (!isDesktopOfflineBridge()) return null;
  return window.desktopCashier.offlineSaveSale(payload);
}

export async function offlineListPendingSales() {
  if (!isDesktopOfflineBridge()) return [];
  return window.desktopCashier.offlineListPendingSales();
}

export async function offlineListMySales(opts) {
  if (!isDesktopOfflineBridge()) return [];
  return window.desktopCashier.offlineListMySales(opts);
}

export async function offlineMarkSalesSynced(results) {
  if (!isDesktopOfflineBridge()) return null;
  return window.desktopCashier.offlineMarkSalesSynced(results);
}

export async function offlineDecreaseStock(productId, quantity) {
  if (!isDesktopOfflineBridge()) return null;
  return window.desktopCashier.offlineDecreaseStock({ productId, quantity });
}

export function subscribeOfflineConnectivity(callback) {
  if (!isDesktopOfflineBridge() || typeof window.desktopCashier.onOfflineConnectivity !== 'function') {
    return () => {};
  }
  return window.desktopCashier.onOfflineConnectivity(callback);
}
