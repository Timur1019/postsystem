import {
  canFallbackToOfflineCheckout,
  refreshConnectivityStatus,
  shouldUseOfflinePos,
} from '../../store/connectivityStore';
import {
  isDesktopOfflineBridge,
  offlineDecreaseStock,
  offlineGetCurrentShift,
  offlineOpenShift,
  offlineSaveSale,
  offlineSyncShiftFromServer,
} from './desktopOfflineBridge';
import {
  buildOfflineCheckoutPayload,
  buildOfflineSaleResponse,
} from './buildOfflineSaleResponse';

function newClientSaleId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `off-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function syncCachedShiftToLocal({ cachedShift, storeId, user, storeName }) {
  if (!cachedShift || cachedShift.status !== 'OPEN' || !user?.id || !storeId) return null;
  try {
    await offlineSyncShiftFromServer({
      shift: cachedShift,
      storeId,
      cashierId: user.id,
      cashierName: user?.fullName || user?.username || cachedShift.cashierName || '',
      storeName: storeName || cachedShift.storeName || '',
    });
  } catch {
    // try reading local shift below
  }
  return offlineGetCurrentShift({ storeId, cashierId: user.id });
}

async function openLocalShiftFallback({ storeId, user, storeName }) {
  if (!canFallbackToOfflineCheckout() || !user?.id || !storeId) return null;
  try {
    return await offlineOpenShift({
      storeId,
      cashierId: user.id,
      cashierName: user?.fullName || user?.username || '',
      storeName: storeName || '',
    });
  } catch {
    return null;
  }
}

/** Гарантирует открытую локальную смену перед офлайн-продажей. */
export async function resolveOfflineShiftForCheckout({
  storeId,
  user,
  cachedShift = null,
  storeName = '',
}) {
  if (!user?.id || !storeId) {
    throw new Error('OFFLINE_SHIFT_REQUIRED');
  }

  let shift = await offlineGetCurrentShift({ storeId, cashierId: user.id });
  if (shift?.status === 'OPEN') return shift;

  shift = await syncCachedShiftToLocal({ cachedShift, storeId, user, storeName });
  if (shift?.status === 'OPEN') return shift;

  shift = await openLocalShiftFallback({ storeId, user, storeName });
  if (shift?.status === 'OPEN') return shift;

  throw new Error('OFFLINE_SHIFT_REQUIRED');
}

export function shouldRunOfflineCheckoutFirst() {
  if (!isDesktopOfflineBridge()) return false;
  if (!canFallbackToOfflineCheckout()) return false;
  return shouldUseOfflinePos();
}

async function applyLocalStockDecrease(cartItems) {
  for (const line of cartItems) {
    try {
      await offlineDecreaseStock(line.productId, line.quantity);
    } catch {
      // stock mirror must not block sale
    }
  }
}

export async function processOfflineCheckout({
  storeId,
  payment,
  user,
  cachedShift,
  storeName,
  getCheckoutLineItems,
  getCheckoutOrderDiscountAmount,
  getCheckoutOrderDiscountPercent,
  items,
}) {
  const shift = await resolveOfflineShiftForCheckout({
    storeId,
    user,
    cachedShift,
    storeName,
  });

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
    storeName: shift.storeName || storeName,
    cashierName: user?.fullName || user?.username || shift.cashierName,
    shift,
    cartItems,
    orderDiscountAmount,
    orderDiscountPercent,
  });

  const saved = await offlineSaveSale({
    clientShiftId: shift.id || shift.clientShiftId,
    payload,
    response,
  });
  if (!saved?.clientSaleId) {
    throw new Error('OFFLINE_SALE_SAVE_FAILED');
  }

  await applyLocalStockDecrease(cartItems);
  void refreshConnectivityStatus();
  return { data: response };
}
