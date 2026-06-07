/** Разрешён ли офлайн-режим POS (desktop) для текущего пользователя. */
export function userHasCashierOfflineAccess(user) {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  return Array.isArray(user.allowedModules) && user.allowedModules.includes('cashierOffline');
}
