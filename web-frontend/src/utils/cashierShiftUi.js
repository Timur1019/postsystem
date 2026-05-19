const CLOSED_KEY = 'cashier-shift-closed';
const ACTIVE_KEY = 'cashier-shift-active';

function closedKey(storeId, userId) {
  return `${CLOSED_KEY}:${userId}:${storeId}`;
}

function activeKey(storeId, userId) {
  return `${ACTIVE_KEY}:${userId}:${storeId}`;
}

/** Пользователь закрыл смену — не подтягиваем /current (иначе бэкенд откроет снова). */
export function isCashierShiftUiClosed(storeId, userId) {
  if (storeId == null || userId == null) return false;
  try {
    return localStorage.getItem(closedKey(storeId, userId)) === '1';
  } catch {
    return false;
  }
}

/** Смена явно открыта в UI — только тогда синхронизируем с /current. */
export function isCashierShiftUiActive(storeId, userId) {
  if (storeId == null || userId == null) return false;
  try {
    return localStorage.getItem(activeKey(storeId, userId)) === '1';
  } catch {
    return false;
  }
}

export function setCashierShiftUiClosed(storeId, userId, closed) {
  if (storeId == null || userId == null) return;
  try {
    if (closed) {
      localStorage.setItem(closedKey(storeId, userId), '1');
      localStorage.removeItem(activeKey(storeId, userId));
    } else {
      localStorage.removeItem(closedKey(storeId, userId));
    }
  } catch {
    /* ignore */
  }
}

export function setCashierShiftUiActive(storeId, userId, active) {
  if (storeId == null || userId == null) return;
  try {
    if (active) {
      localStorage.setItem(activeKey(storeId, userId), '1');
      localStorage.removeItem(closedKey(storeId, userId));
    } else {
      localStorage.removeItem(activeKey(storeId, userId));
    }
  } catch {
    /* ignore */
  }
}
