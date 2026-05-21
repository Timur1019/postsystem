const LOCK_KEY = 'cashier-screen-locked';

function lockKey(userId) {
  return `${LOCK_KEY}:${userId}`;
}

export function isCashierScreenLocked(userId) {
  if (userId == null) return false;
  try {
    return sessionStorage.getItem(lockKey(userId)) === '1';
  } catch {
    return false;
  }
}

export function setCashierScreenLocked(userId, locked) {
  if (userId == null) return;
  try {
    if (locked) {
      sessionStorage.setItem(lockKey(userId), '1');
    } else {
      sessionStorage.removeItem(lockKey(userId));
    }
  } catch {
    /* ignore */
  }
}

export function clearCashierScreenLocked(userId) {
  setCashierScreenLocked(userId, false);
}
