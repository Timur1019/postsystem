/**
 * Чистые правила offline/online для кассы (без zustand/DOM).
 * Используются в connectivityStore и verify-offline-connectivity.mjs.
 */

export function catalogMatchesStore(catalogStoreId, requestedStoreId) {
  if (requestedStoreId == null || catalogStoreId == null) return false;
  return Number(catalogStoreId) === Number(requestedStoreId);
}

export function hasLocalPosCatalog(state, storeId) {
  if (!state) return false;
  if (!Boolean(state.bootstrapReady || state.canSellOffline || state.productCount > 0)) {
    return false;
  }
  return catalogMatchesStore(state.storeId, storeId);
}

export function isConnectivityOfflineLike(state) {
  const browserOffline =
    typeof navigator !== 'undefined' && navigator.onLine === false;
  return Boolean(state?.offlineMode || !state?.apiOnline || browserOffline);
}

export function isCatalogStoreMismatch(catalogStoreId, requestedStoreId) {
  if (catalogStoreId == null || requestedStoreId == null) return false;
  return Number(catalogStoreId) !== Number(requestedStoreId);
}

/**
 * Desktop + офлайн + каталог текущего магазина → local-first checkout/catalog.
 */
export function shouldPreferLocalCheckout({
  isDesktop,
  offlineAllowed,
  offlineLike,
  state,
  storeId,
}) {
  if (!isDesktop || !offlineAllowed) return false;
  if (!offlineLike) return false;
  return hasLocalPosCatalog(state, storeId);
}

export function shouldUseLocalPosCatalog({
  isDesktop,
  offlineAllowed,
  offlineLike,
  state,
  storeId,
}) {
  return shouldPreferLocalCheckout({ isDesktop, offlineAllowed, offlineLike, state, storeId });
}

/** Fallback SQLite после сбоя онлайн-запроса (каталог/штрихкод). */
export function canUseOfflineCatalogFallback({
  isDesktop,
  offlineAllowed,
  state,
  storeId,
}) {
  if (!isDesktop || !offlineAllowed) return false;
  return hasLocalPosCatalog(state, storeId);
}

/** Fallback SQLite при сбое API оплаты. */
export function canFallbackToOfflineCheckout({
  isDesktop,
  offlineAllowed,
  state,
  storeId,
}) {
  return canUseOfflineCatalogFallback({ isDesktop, offlineAllowed, state, storeId });
}

const OFFLINE_CHECKOUT_NO_ONLINE_RETRY = new Set([
  'offline_ipc_timeout',
  'offline_checkout_timeout',
  'OFFLINE_SALE_SAVE_FAILED',
  'offline_sale_save_failed',
  'OFFLINE_SHIFT_REQUIRED',
]);

export function shouldRetryOnlineAfterOfflineFailure(offlineErr, ctx) {
  const msg = String(offlineErr?.message || '');
  if (OFFLINE_CHECKOUT_NO_ONLINE_RETRY.has(msg)) return false;
  if (ctx.offlineLike) return false;
  if (
    shouldPreferLocalCheckout({
      isDesktop: ctx.isDesktop,
      offlineAllowed: ctx.offlineAllowed,
      offlineLike: ctx.offlineLike,
      state: ctx.state,
      storeId: ctx.storeId,
    })
  ) {
    return false;
  }
  return Boolean(ctx.apiOnline && !ctx.offlineMode);
}

/** Единый контекст для store / checkout / тестов. */
export function buildConnectivityContext({
  isDesktop,
  offlineAllowed,
  state,
  storeId = null,
}) {
  const offlineLike = isConnectivityOfflineLike(state);
  return {
    isDesktop: Boolean(isDesktop),
    offlineAllowed: Boolean(offlineAllowed),
    offlineLike,
    state,
    storeId,
    apiOnline: state?.apiOnline,
    offlineMode: state?.offlineMode,
  };
}

export { OFFLINE_CHECKOUT_NO_ONLINE_RETRY };
