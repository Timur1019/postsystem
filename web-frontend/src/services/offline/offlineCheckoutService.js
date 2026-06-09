import {
  canFallbackToOfflineCheckout,
  isConnectivityOfflineLike,
  refreshConnectivityStatus,
  shouldUseOfflinePos,
  useConnectivityStore,
} from '../../store/connectivityStore';
import { userHasCashierOfflineAccess } from '../../utils/cashierOfflineAccess';
import { useAuthStore } from '../../store/authStore';
import { isDesktopOfflineBridge, offlineCompleteCheckout } from './desktopOfflineBridge';
import {
  buildOfflineCheckoutPayload,
  buildOfflineSaleResponse,
} from './buildOfflineSaleResponse';

const CHECKOUT_TIMEOUT_MS = 10_000;

function newClientSaleId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `off-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function withCheckoutTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('offline_checkout_timeout')), CHECKOUT_TIMEOUT_MS);
    }),
  ]);
}

/** Desktop + локальный каталог или офлайн → сначала локальная продажа. */
export function shouldPreferLocalCheckout() {
  if (!isDesktopOfflineBridge()) return false;
  if (!userHasCashierOfflineAccess(useAuthStore.getState().user)) return false;
  const state = useConnectivityStore.getState();
  if (state.canSellOffline) return true;
  return isConnectivityOfflineLike(state);
}

/** @deprecated use shouldPreferLocalCheckout */
export function shouldRunOfflineCheckoutFirst() {
  if (!shouldPreferLocalCheckout()) return false;
  return shouldUseOfflinePos();
}

export async function processOfflineCheckout({
  storeId,
  payment,
  user,
  cachedShift,
  storeName,
  getCheckoutOrderDiscountAmount,
  getCheckoutOrderDiscountPercent,
  items,
}) {
  if (!isDesktopOfflineBridge()) {
    throw new Error('OFFLINE_SALE_SAVE_FAILED');
  }

  const clientSaleId = newClientSaleId();
  const receiptNumber = `OFF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;
  const cartItems = items;
  const orderDiscountAmount = getCheckoutOrderDiscountAmount();
  const orderDiscountPercent = getCheckoutOrderDiscountPercent();

  const payload = buildOfflineCheckoutPayload({
    storeId,
    payment,
    cartItems,
    orderDiscountAmount,
    orderDiscountPercent,
  });

  const response = buildOfflineSaleResponse({
    clientSaleId,
    receiptNumber,
    payment,
    storeId,
    storeName: storeName || cachedShift?.storeName || '',
    cashierName: user?.fullName || user?.username || cachedShift?.cashierName || '',
    shift: cachedShift,
    cartItems,
    orderDiscountAmount,
    orderDiscountPercent,
  });

  const saved = await withCheckoutTimeout(
    offlineCompleteCheckout({
      storeId,
      cashierId: user?.id,
      cashierName: user?.fullName || user?.username || '',
      storeName: storeName || cachedShift?.storeName || '',
      cachedShift,
      payload,
      response,
      stockLines: cartItems.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
      })),
    }),
  );

  if (!saved?.clientSaleId) {
    throw new Error('OFFLINE_SALE_SAVE_FAILED');
  }

  void refreshConnectivityStatus();
  return { data: { ...response, receiptNumber: saved.receiptNumber || response.receiptNumber } };
}

/** Пробовать локальный чекаут; при онлайне — fallback на сервер. */
export function shouldRetryOnlineAfterOfflineFailure() {
  const state = useConnectivityStore.getState();
  return Boolean(state.apiOnline && !state.offlineMode && !shouldUseOfflinePos());
}
